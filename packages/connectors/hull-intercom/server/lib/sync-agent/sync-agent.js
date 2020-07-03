// @flow

import type { HullContext } from "hull/src/types/context";

const _ = require("lodash");
const moment = require("moment");
const Promise = require("bluebird");
const { ConfigurationError } = require("hull/src/errors");

const TagMapping = require("./tag-mapping");
const UserMapping = require("./user-mapping");
const WebhookAgent = require("./webhook-agent");
const { jsonifyArrays } = require("../utils/utils");
const { deduplicateUserUpdateMessages } = require("../../lib/filter-utils");
const getEventPayload = require("../event/get-event-payload");

// const handleRateLimitError = require("../../lib/handle-rate-limit-error");

class SyncAgent {
  enqueue;

  intercomAgent;

  ship;

  segments;

  client;

  helpers;

  logger;

  metric;

  private_settings;

  constructor(intercomAgent, ctx: HullContext) {
    const {
      client,
      cache,
      metric,
      helpers,
      usersSegments: segments,
      connector: ship,
      hostname,
      enqueue
    } = ctx;
    this.enqueue = enqueue;
    this.intercomAgent = intercomAgent;
    this.ship = ship;
    this.segments = segments;
    this.client = client;
    this.helpers = helpers;
    this.logger = client.logger;
    this.metric = metric;
    this.private_settings = ship.private_settings;

    this.tagMapping = new TagMapping(
      intercomAgent,
      ship,
      helpers,
      client.logger
    );
    this.userMapping = new UserMapping({ ship, client });
    this.webhookAgent = new WebhookAgent(
      intercomAgent,
      client,
      ship,
      helpers,
      hostname,
      cache
    );
  }

  isConfigured() {
    return this.intercomAgent.intercomClient.ifConfigured();
  }

  syncShip({ forceTagsResync = false } = {}) {
    return this.webhookAgent
      .ensureWebhook()
      .then(() => this.tagMapping.sync(this.segments, forceTagsResync));
  }

  sendUserMessages(messages = []): Promise<*> {
    if (!this.isConfigured()) {
      this.logger.error("connector.configuration.error", {
        errors: "connector is not configured"
      });
      return Promise.resolve();
    }

    const leadMessages = [];
    const leadsToConvert = [];
    const users = messages.reduce((accumulator, message) => {
      const { user, changes = {}, segments = [], events = [] } = message;
      const { left = [], entered = [] } = _.get(changes, "segments", {});

      this.client.asUser(user).logger.debug("outgoing.user.start", {
        changes,
        events: _.map(events, e => e.event),
        segments: _.map(segments, s => s.name)
      });

      if (
        _.get(this.private_settings, "ignore_deleted_users", true) &&
        _.get(user, "intercom/deleted_at", null)
      ) {
        this.client.asUser(user).logger.debug("outgoing.user.skip", {
          reason: "User has been deleted"
        });
        return accumulator;
      }

      if (
        this.private_settings.skip_users_already_synced &&
        _.get(user, "intercom/id") &&
        _.isEmpty(events)
      ) {
        const hullTraits = this.userMapping
          .computeIntercomFields()
          .map(f => f.hull);
        const changedTraits = _.keys(_.get(changes, "user"));
        if (_.intersection(hullTraits, changedTraits).length === 0) {
          this.client.asUser(user).logger.debug("outgoing.user.skip", {
            reason:
              "user already synced with Intercom, none of selected attributes were changed and no event happened"
          });
          return accumulator;
        }
      }

      user.segment_ids = _.concat(
        user.segment_ids || [],
        segments.map(s => s.id)
      );

      const filteredUser = this.updateUserSegments(user, {
        add_segment_ids: entered.map(s => s.id),
        remove_segment_ids: left.map(s => s.id)
      });

      if (!filteredUser) {
        this.client.asUser(user).logger.debug("outgoing.user.skip", {
          reason: "doesn't match filtered segments"
        });
        return accumulator;
      }

      if (
        user["intercom/is_lead"] === true &&
        user.external_id &&
        user["intercom/anonymous"] === false
      ) {
        leadsToConvert.push(user);
        return accumulator;
      }

      if (user["intercom/is_lead"] === true) {
        leadMessages.push(message);
        return accumulator;
      }

      user.events = events || [];
      return accumulator.concat(user);
    }, []);

    const promises = [];

    if (!_.isEmpty(users)) {
      promises.push(this.sendUsers(users));
    }

    if (!_.isEmpty(leadMessages)) {
      const deduplicatedUserMessages = deduplicateUserUpdateMessages(
        leadMessages
      );
      promises.push(this.sendLeads(deduplicatedUserMessages));
    }

    if (!_.isEmpty(leadsToConvert)) {
      promises.push(this.convertLeadsToUsers(leadsToConvert));
    }

    return Promise.all(promises);
  }

  postConvertLead(user: Object): Promise {
    this.client.logger.debug("outgoing.user", user);

    return this.intercomAgent.intercomClient
      .post("/contacts/convert", {
        contact: { user_id: user["intercom/lead_user_id"] },
        user: { user_id: user.external_id }
      })
      .then(response => {
        return response.body;
      })
      .catch(err => {
        this.client.logger.error("postConvertLead.error", err);
        return Promise.resolve(err);
      });
  }

  convertLeadsToUsers(users): Promise {
    return Promise.map(users, user => {
      const ident = { id: user.id };
      return this.postConvertLead(user)
        .then(() => {
          return this.client.asUser(ident).traits({
            "intercom/is_lead": false
          });
        })
        .catch(fErr => {
          if (fErr.statusCode === 404) {
            return this.client.asUser(ident).traits({
              "intercom/is_lead": false
            });
          }
          return Promise.reject(fErr);
        })
        .catch(ConfigurationError, () => {
          return Promise.resolve();
        });
    });
  }

  sendLeads(leadMessages) {
    // This uses a distributed lock pattern to ensure we're not sending leads
    // for the same org at the same time
    // it compensates for the scenario where we may timeout, and kraken sends another message
    // even this logic doesn't quite handle all of the edge cases
    // if it takes longer than 25s to get/set the lock, it's possible that we
    // call "get" before we've set the lock, and then we'll have 2 processes in send lead
    // synchronous lock semantics would be better, but it should be more than adequate
    // to compensate for the edge case where kraken resends the message
    // after the previous one times out
    // if an edge case does occur, the additional logging should enable us to identify the situation
    const getStart = moment();
    return this.cache.get("sendleads").then(lock => {
      const setStart = moment();
      const getLatency = moment.duration(setStart.diff(getStart)).asSeconds();
      this.client.logger.debug(
        `Got lock value for sendleads: ${JSON.stringify(
          lock
        )} in ${getLatency}s`
      );
      if (lock === "processing") {
        this.client.logger.debug(
          "Sending leads in progress, rejecting another attempt"
        );
        return Promise.reject(
          new Error(
            "Rejecting another attempt to send leads while sendleads is in progress"
          )
        );
      }

      // This ttl is important because it represents the amount of time we are willing to lock
      // The reason why this must have a threshold is if the dyno that this is
      // running on goes down, the lock will stay in the cache until expiration
      // it may could block processing until expiration
      const lockTtl = process.env.LEAD_LOCK_TTL || 1800;
      return this.cache
        .set("sendleads", "processing", { ttl: lockTtl })
        .then(() => {
          const setLatency = moment
            .duration(moment().diff(setStart))
            .asSeconds();
          this.client.logger.debug(
            `Acquired lock to sendleads in ${setLatency}`
          );

          return this.sendLeadsImpl(leadMessages)
            .then(result => {
              this.client.logger.debug("Releasing lock to sendleads");
              return this.cache.set("sendleads", "done").then(() => {
                const fullLatency = moment
                  .duration(moment().diff(getStart))
                  .asSeconds();
                this.metric.value("ship.outgoing.leadlatency", fullLatency);
                this.client.logger.debug(
                  `Released lock to sendleads ${fullLatency}`
                );
                return Promise.resolve(result);
              });
            })
            .catch(error => {
              this.client.logger.debug("Releasing lock to sendleads in error");
              return this.cache.set("sendleads", "done").then(() => {
                const fullLatency = moment
                  .duration(moment().diff(getStart))
                  .asSeconds();
                this.metric.value("ship.outgoing.leadlatency", fullLatency);
                this.client.logger.debug(
                  `Released lock to sendleads in error ${fullLatency}`
                );
                return Promise.reject(error);
              });
            });
        });
    });
  }

  getLeadIdPromise(user) {
    const userLeadId = user["intercom/lead_user_id"];
    this.client.logger.debug(`trying to get leadid: ${userLeadId}`);
    if (_.isEmpty(userLeadId)) {
      return this.cache.get(user.id).then(leadId => {
        if (leadId) {
          this.client.logger.debug(`Got lead id from cache: ${leadId}`);
        } else {
          this.client.logger.debug(`No lead id in cache for user ${user.id}`);
        }
        return leadId;
      });
    }

    return Promise.resolve(userLeadId);
  }

  createLeadToPostPromise(message) {
    return this.getLeadIdPromise(message.user).then(leadId => {
      // this method still pulls the lead_user_id from the user
      // but should probably just take that out
      // we're handling that up here as we probably should
      const leadToSave = this.userMapping.getIntercomLeadFields(message.user);
      if (leadId) {
        leadToSave.user_id = leadId;
      }
      return { leadToSave, user: message.user };
    });
  }

  sendLeadsImpl(leadMessages) {
    this.ctx.client.logger.debug("sendLeads.preFilter", leadMessages.length);

    leadMessages.map(message =>
      this.client.asUser(message.user).logger.debug("outgoing.user.start")
    );

    return this.syncShip()
      .then(() => {
        return Promise.all(
          leadMessages.map(message => this.createLeadToPostPromise(message))
        );
      })
      .then(leadToSaveArray => {
        // make sure all of the leads we're sending are valid
        const filteredLeads = leadToSaveArray.reduce((leads, lead) => {
          if (lead.leadToSave) {
            leads.push(lead);
          }
          return leads;
        }, []);

        this.client.logger.debug("sendLeads.filtered", filteredLeads.length);
        this.metric.increment("ship.outgoing.leads", filteredLeads.length);

        if (filteredLeads.length === 0) {
          return Promise.resolve([]);
        }

        return this.postLeads(filteredLeads);
      })
      .then(res => {
        const savedUsers = [];

        _.forEach(res, postResult => {
          const intercomData = postResult.response_body;
          if (!intercomData) {
            return;
          }
          const hullUser = postResult.user;
          hullUser["intercom/id"] = intercomData.id;
          hullUser["intercom/tags"] = intercomData.tags.tags.map(t => t.name);

          this.client
            .asUser(_.pick(hullUser, ["email", "id", "external_id"]))
            .logger.info("outgoing.user.success");

          savedUsers.push(hullUser);
        });

        const errors = _.filter(res, { body: { type: "error.list" } });
        this.client.logger.debug("sendLeads.savedleads", savedUsers.length);
        const groupedErrors = errors.map(errorReq => {
          return {
            data: errorReq.req.data,
            error: errorReq.body.errors
          };
        });
        return Promise.all(
          res.map(postResult => this.storeLeadIdFromResponse(postResult))
        )
          .then(() => this.sendEvents(savedUsers))
          .then(() => this.groupUsersToTag(savedUsers))
          .then(groupedleads => this.intercomAgent.tagUsers(groupedleads))
          .then(() => this.handleUserErrors(groupedErrors));
      })
      .catch(ConfigurationError, () => {
        return Promise.resolve();
      });
  }

  storeLeadIdFromResponse(postResult) {
    if (!postResult.response_body) {
      return Promise.resolve();
    }
    if (!_.isEmpty(postResult.user["intercom/lead_user_id"])) {
      return Promise.resolve();
    }

    const response = postResult.response_body;
    return this.cache.set(postResult.user.id, response.user_id).then(() => {
      return this.saveLeads([response]);
    });
  }

  postLeads(leads: Array<Object>): Promise {
    if (_.isEmpty(leads)) {
      this.client.logger.debug("postLeads.emptyList");
      return Promise.resolve();
    }

    this.client.logger.debug("postLeads", leads.length);

    return Promise.map(
      leads,
      leadEnvelope => {
        const leadToSave = leadEnvelope.leadToSave;
        return this.intercomAgent.intercomClient
          .post("/contacts", leadToSave)
          .then(response => {
            return {
              response_body: response.body,
              user: leadEnvelope.user,
              leadToSave
            };
          })
          .catch(err => {
            this.client
              .asUser({
                email: leadToSave.email,
                external_id: leadToSave.user_id
              })
              .logger.error("outgoing.user.error", err);
            return Promise.resolve(err);
          });
      },
      {
        concurrency:
          parseInt(process.env.LEADS_API_REQUEST_CONCURRENCY, 10) || 10
      }
    );
  }

  sendUsers(users, params = {}) {
    const { mode = "bulk" } = params;

    this.client.logger.debug("sendUsers.preFilter", users.length);
    const usersToSave = this.getUsersToSave(users);
    const intercomUsersToSave = usersToSave.map(u =>
      this.userMapping.getIntercomFields(u)
    );

    this.client.logger.debug("sendUsers.filtered", intercomUsersToSave.length);
    this.metric.increment("ship.outgoing.users", intercomUsersToSave.length);

    return (
      this.syncShip()
        .then(() => {
          return this.intercomAgent.sendUsers(intercomUsersToSave, mode);
        })
        .then(res => {
          if (_.isArray(res)) {
            const savedUsers = _.intersectionBy(usersToSave, res, "email").map(
              u => {
                const intercomData = _.find(res, { email: u.email });
                u["intercom/id"] = intercomData.id;
                u["intercom/tags"] = intercomData.tags.tags.map(t => t.name);

                this.client
                  .asUser(_.pick(u, ["email", "id", "external_id"]))
                  .logger.info("outgoing.user.success", intercomData);
                return u;
              }
            );
            const errors = _.filter(res, { body: { type: "error.list" } });

            const groupedErrors = errors.map(errorReq => {
              return {
                data: errorReq.req.data,
                error: errorReq.body.errors,
                statusCode: res.statusCode
              };
            });

            return this.sendEvents(savedUsers)
              .then(() => {
                return this.groupUsersToTag(savedUsers);
              })
              .then(groupedUsers => {
                return this.intercomAgent.tagUsers(groupedUsers);
              })
              .then(() => {
                return this.handleUserErrors(groupedErrors);
              });
          }

          if (_.get(res, "body.id")) {
            return this.enqueue(
              "handleBulk",
              { users: usersToSave, id: res.body.id },
              { delay: parseInt(process.env.BULK_JOB_DELAY, 10) || 10000 }
            );
          }
          return Promise.resolve();
        })
        // eslint-disable-next-line no-unused-vars
        .catch(err => {
          // return handleRateLimitError(ctx, "sendUsers", params, err);
        })
    );
  }

  userAdded(user) {
    // eslint-disable-line class-methods-use-this
    return !_.isEmpty(user["intercom/id"]);
  }

  userWithError(user) {
    // eslint-disable-line class-methods-use-this
    return (
      !_.isEmpty(user["intercom/import_error"]) &&
      _.get(user, "intercom/import_error", "").match("Exceeded rate limit") ===
        null
    );
  }

  userWhitelisted(user) {
    const segmentIds = _.get(
      this.ship,
      "private_settings.synchronized_segments",
      []
    );
    return _.intersection(segmentIds, user.segment_ids).length > 0;
  }

  fetchSegments() {
    return this.intercomAgent.intercomClient.getSegments().then(response => {
      const intercomSegments = _.reduce(
        response.body.segments,
        (acc, value) => {
          acc[value.id] = value.name;
          return acc;
        },
        {}
      );
      return this.helpers.settingsUpdate({
        intercom_segments: intercomSegments
      });
    });
  }

  handleUserErrors(errors) {
    return Promise.map(errors, error => {
      if (_.get(error, "statusCode") === 429) {
        // Rate limit error
      }
      let errorDetails = _.get(error, "error", []);
      if (!_.isArray(errorDetails)) {
        errorDetails = [errorDetails];
      }

      const errorMessage = errorDetails.map(e => e.message).join(" ");

      const ident = this.userMapping.getIdentFromIntercom(error.data);

      const asUser = this.client.asUser(ident);
      asUser.logger.error("outgoing.user.error", { errors: errorDetails });

      if (
        errorMessage.match("Exceeded rate limit") !== null ||
        errorMessage.match("Lead Not Found") !== null
      ) {
        return Promise.resolve();
      }
      return asUser.traits({ "intercom/import_error": errorMessage });
    });
  }

  getUsersToSave(users) {
    return users
      .filter(u => !_.isEmpty(u.email) && !this.userWithError(u))
      .map(u => {
        u.email = _.toLower(u.email);
        return u;
      });
  }

  getUsersToTag(users) {
    return users.filter(
      u =>
        this.userWhitelisted(u) && this.userAdded(u) && !this.userWithError(u)
    );
  }

  groupUsersToTag(users) {
    const segments = this.segments;
    return _.reduce(
      users,
      (o, user) => {
        const existingUserTags = _.intersection(
          user["intercom/tags"],
          segments.map(s => s.name)
        );

        const userOp = {};
        if (!_.isEmpty(user["intercom/id"])) {
          userOp.id = user["intercom/id"];
        } else if (!_.isEmpty(user.email)) {
          userOp.email = user.email;
        } else {
          return o;
        }
        const segmentsToAdd = _.has(user, "add_segment_ids")
          ? user.add_segment_ids
          : user.segment_ids;
        segmentsToAdd.map(segment_id => {
          const segment = _.find(segments, { id: segment_id });
          if (_.isEmpty(segment)) {
            this.client.logger.debug(
              "outgoing.user.add_segment_not_found",
              segment
            );
            return o;
          }
          if (_.includes(existingUserTags, segment.name)) {
            this.client.logger.debug(
              "outgoing.user.add_segment_skip",
              segment.name
            );
            return null;
          }
          o[segment.name] = o[segment.name] || [];
          return o[segment.name].push(userOp);
        });
        user.remove_segment_ids.map(segment_id => {
          const segment = _.find(segments, { id: segment_id });
          if (_.isEmpty(segment)) {
            this.client.logger.debug(
              "outgoing.user.remove_segment_not_found",
              segment
            );
            return o;
          }
          o[segment.name] = o[segment.name] || [];
          return o[segment.name].push(
            _.merge({}, userOp, {
              untag: true
            })
          );
        });
        return o;
      },
      {}
    );
  }

  /**
   * When the user is within the
   * @type {Array}
   */
  updateUserSegments(
    user,
    { add_segment_ids = [], remove_segment_ids = [] },
    ignoreFilter = false
  ) {
    if (this.userWhitelisted(user) || ignoreFilter === true) {
      user.add_segment_ids = _.uniq(
        _.concat(user.segment_ids || [], _.filter(add_segment_ids))
      );
      user.remove_segment_ids = _.filter(remove_segment_ids);
    } else {
      return null;
    }
    return user;
  }

  /**
   * Sends Hull events to Intercom. Only for users with `intercom/id` and events matching
   * the set filter.
   * @param  {Array} users Hull users with `events` property supplied
   * @return {Promise}
   */
  sendEvents(users) {
    if (
      !this.ship.private_settings.send_events ||
      this.ship.private_settings.send_events.length === 0
    ) {
      this.logger.debug(
        "sendEvents.send_events_enabled",
        "No events specified."
      );
      return Promise.resolve();
    }

    const events = _.chain(users)
      .tap(u => this.logger.debug("sendEvents.users", u.length))
      .filter(u => !_.isUndefined(u["intercom/id"]))
      .tap(u => this.logger.debug("sendEvents.users.filtered", u.length))
      .map(u => {
        return _.get(u, "events", []).map(e => {
          e.user = {
            id: u["intercom/id"]
          };
          return e;
        });
      })
      .flatten()
      .tap(e => this.logger.debug("sendEvents.events", e.length))
      .filter(e => _.includes(this.ship.private_settings.send_events, e.event))
      .filter(e => e.event_source !== "intercom")
      .tap(e => this.logger.debug("sendEvents.events.filtered", e.length))
      .map(ev => {
        const metadata = _.reduce(
          ev.properties,
          (results, value, key) => {
            if (Array.isArray(value)) {
              this.logger.debug(`Invalid Event Property: ${key}=${value}`);
              results[key] = JSON.stringify(value);
            } else if (_.isPlainObject(value)) {
              results[key] = jsonifyArrays(value);
            } else {
              results[key] = value;
            }
            return results;
          },
          {}
        );

        const data = {
          event_name: ev.event,
          created_at: moment(ev.created_at).format("X"),
          id: ev.user.id,
          metadata
        };
        this.logger.debug("outgoing.event", data);
        return data;
      })
      .value();

    return this.intercomAgent.sendEvents(events).catch(err => {
      this.logger.error("outgoing.event.error", err);
      return Promise.reject(err);
    });
  }

  detachUserFromIntercom({ intercomUser, identity, deleteRequestId }) {
    const ident = !identity
      ? this.userMapping.getIdentFromIntercom(intercomUser)
      : identity;

    if (!intercomUser) {
      intercomUser = {
        updated_at: new Date()
      };
    }

    const traits = this.userMapping.mapToHullDeletedObject(intercomUser);

    if (deleteRequestId) {
      _.set(traits, "intercom/delete_request_id", deleteRequestId);
    }

    if (!_.isEmpty(ident)) {
      const asUser = this.client.asUser(ident);
      return asUser
        .traits(traits)
        .then(() => asUser.logger.debug("incoming.user.deletion", { traits }))
        .catch(error => asUser.logger.error("incoming.user.error", { error }));
    }
    return this.client
      .asUser(ident)
      .logger.debug("incoming.user.skip", { reason: "missing identity" });
  }

  deleteContact(id) {
    return this.intercomAgent.deleteContact(id).then(intercomUser => {
      return this.detachUserFromIntercom({ intercomUser });
    });
  }

  deleteUser(deleteUserPayload) {
    return this.intercomAgent.deleteUser(deleteUserPayload).then(response => {
      const deleteRequestId = response.id;
      const identity = _.pick(deleteUserPayload, [
        "email",
        "external_id",
        "anonymous_id"
      ]);
      if (!identity) {
        return Promise.resolve();
      }
      return this.detachUserFromIntercom({
        identity,
        deleteRequestId
      });
    });
  }

  saveUsersDeletion(users) {
    this.metric.increment("ship.incoming.users", users.length);

    return Promise.map(users, intercomUser => {
      return this.detachUserFromIntercom(intercomUser);
      // eslint-disable-next-line no-unused-vars
    }).catch(err => {
      // return handleRateLimitError(ctx, "saveUsers", payload, err)
    });
  }

  saveUsers(users) {
    this.metric.increment("ship.incoming.users", users.length);

    return (
      Promise.map(users, intercomUser => {
        const ident = this.userMapping.getIdentFromIntercom(intercomUser);
        const traits = this.userMapping.getHullTraits(intercomUser);
        if (ident.email) {
          const asUser = this.client.asUser(ident);
          return asUser
            .traits(traits)
            .then(() =>
              asUser.logger.debug("incoming.user.success", { traits })
            )
            .catch(error =>
              asUser.logger.error("incoming.user.error", { error })
            );
        }
        return this.client.asUser(ident).logger.debug("incoming.user.skip", {
          reason: "missing email in ident"
        });
      })
        .then(() => {
          const customAttributes = _.uniq(
            _.flatten(users.map(u => _.keys(u.custom_attributes)))
          );
          const oldAttributes = _.compact(
            this.private_settings.custom_attributes
          );
          const newAttributes = _.difference(customAttributes, oldAttributes);
          if (!_.isEmpty(newAttributes)) {
            return this.helpers.settingsUpdate({
              custom_attributes: _.concat(oldAttributes, newAttributes)
            });
          }
          return true;
        })
        // eslint-disable-next-line no-unused-vars
        .catch(err => {
          // return handleRateLimitError(ctx, "saveUsers", payload, err)
        })
    );
  }

  getLeadIdentity(lead: Object): Object {
    const ident = {};

    ident.anonymous_id = `intercom:${lead.user_id}`;
    if (lead.email) {
      ident.email = lead.email;
    }
    return ident;
  }

  isTagEvent(intercomEvent: Object): boolean {
    if (
      _.includes(
        ["user.tag.created", "user.tag.deleted"],
        intercomEvent.topic
      ) &&
      (_.includes(
        this.tagMapping.getTagIds(),
        intercomEvent.data.item.tag.id
      ) ||
        _.includes(
          this.segments.map(s => s.name),
          intercomEvent.data.item.tag.name
        ))
    ) {
      return true;
    }
    return false;
  }

  saveEvents(events) {
    return Promise.map(events, event => {
      const { user, eventName, props, context } = getEventPayload(event);

      if (!user) {
        return Promise.resolve();
      }

      let ident;
      // anonymous is set to true for intercom leads
      if (
        user.anonymous === true ||
        user.type === "lead" ||
        user.type === "contact"
      ) {
        ident = this.getLeadIdentity(user);
        context.active = true;
      } else {
        ident = this.userMapping.getIdentFromIntercom(user);
      }

      if (this.isTagEvent(event)) {
        this.client.logger.debug("skipping tag event", {
          user: user.email,
          topic: event.topic,
          tag: event.data.item.tag.name
        });
        return Promise.resolve("ok");
      }

      this.metric.increment("ship.incoming.events", 1);
      const asUser = this.client.asUser(ident);
      return asUser.track(eventName, props, context).then(
        () =>
          asUser.logger.debug("incoming.event.success", {
            eventName,
            props,
            context
          }),
        error =>
          asUser.logger.error("incoming.event.error", {
            eventName,
            props,
            context,
            errors: error
          })
      );
      // eslint-disable-next-line no-unused-vars
    }).catch(err => {
      // return handleRateLimitError(ctx, "saveEvents", payload, err)
    });
  }

  saveLeads(leads, options = {}) {
    const { useFastLane = false } = options;
    return Promise.all(
      _.map(leads, lead => {
        const ident = this.getLeadIdentity(lead);
        let traits = this.userMapping.getHullTraits(lead);
        traits = _.mapValues(traits, trait => {
          if (_.isObject(trait)) {
            return trait;
          }

          return {
            operation: "setIfNull",
            value: trait
          };
        });

        if (lead.avatar && lead.avatar.image_url) {
          traits.picture = {
            operation: "setIfNull",
            value: lead.avatar.image_url
          };
        }

        if (lead.last_seen_ip) {
          traits.last_known_ip = lead.last_seen_ip;
        }

        traits["intercom/is_lead"] = true;
        traits["intercom/lead_user_id"] = lead.user_id;
        _.unset(traits, "intercom/user_id");

        const asUser = this.client.asUser(ident, { active: useFastLane });

        return asUser.traits(traits).then(
          () => asUser.logger.debug("incoming.user.success", { traits }),
          error =>
            asUser.logger.error("incoming.user.error", {
              traits,
              errors: error
            })
        );
      })
    );
  }
}

module.exports = SyncAgent;
