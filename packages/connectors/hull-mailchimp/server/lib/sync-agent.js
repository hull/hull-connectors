/* @flow */
import type { HullUserUpdateMessage, HullUserSegment, HullContext } from "hull";
import type { IUserUpdateEnvelope } from "./types";
import shipAppFactory from "./ship-app-factory";

const _ = require("lodash");
const Promise = require("bluebird");
const debug = require("debug")("hull-mailchimp:sync-agent");

const SegmentsMappingAgent = require("./sync-agent/segments-mapping-util");
const InterestsMappingAgent = require("./sync-agent/interests-mapping-util");
const UserMappingAgent = require("./sync-agent/user-mapping-agent");
const EventsAgent = require("./sync-agent/events-agent");
const AuditUtil = require("./util/audit-util");

class SyncAgent {
  ship: Object;

  mailchimpClient: Object;

  client: Object;

  logger: Object;

  listId: string;

  metric: Object;

  hostname: string;

  segments: Array<HullUserSegment>;

  synchronizedSegments: Array<HullUserSegment>;

  forceRemovalFromStaticSegments: boolean;

  fetchUserActivityOnUpdate: boolean;

  mailchimpAgent: Object;

  segmentsMappingAgent: SegmentsMappingAgent;

  interestsMappingAgent: InterestsMappingAgent;

  userMappingAgent: UserMappingAgent;

  eventsAgent: EventsAgent;

  auditUtil: AuditUtil;

  constructor(
    mailchimpClient: Object,
    mailchimpAgent: Object,
    ctx: HullContext
  ) {
    this.ship = ctx.connector;
    this.mailchimpClient = mailchimpClient;
    this.client = ctx.client;
    this.logger = ctx.client.logger;
    this.metric = ctx.metric;
    this.hostname = ctx.hostname;
    this.segments = ctx.usersSegments;
    this.listId = _.get(ctx.connector, "private_settings.mailchimp_list_id");
    this.synchronizedSegments = (
      ctx.connector.private_settings.synchronized_user_segments ||
      ctx.connector.private_settings.synchronized_segments ||
      []
    ).reduce((segments, id) => {
      const found = _.find(ctx.usersSegments, { id });
      if (found === undefined) {
        return segments;
      }
      return segments.concat([found]);
    }, []);
    this.forceRemovalFromStaticSegments = _.get(
      ctx.connector,
      "private_settings.force_removal_from_static_segments",
      false
    );
    this.fetchUserActivityOnUpdate = _.get(
      ctx.connector,
      "private_settings.fetch_user_activity_on_update",
      true
    );

    this.segmentsMappingAgent = new SegmentsMappingAgent(
      mailchimpClient,
      ctx.connector,
      ctx.helpers
    );
    this.interestsMappingAgent = new InterestsMappingAgent(
      mailchimpClient,
      ctx.connector,
      ctx.helpers
    );
    this.userMappingAgent = new UserMappingAgent(
      ctx.connector,
      ctx.client,
      ctx.metric
    );
    this.eventsAgent = new EventsAgent(
      mailchimpClient,
      ctx.client,
      ctx.connector,
      ctx.metric
    );
    this.auditUtil = new AuditUtil(ctx, mailchimpClient);
    this.mailchimpAgent = mailchimpAgent;
  }

  isConfigured() {
    const apiKey = _.get(this.ship, "private_settings.api_key");
    const domain = _.get(this.ship, "private_settings.domain");
    const listId = _.get(this.ship, "private_settings.mailchimp_list_id");
    return !_.isEmpty(domain) && !_.isEmpty(apiKey) && !_.isEmpty(listId);
  }

  messageAdded(message: HullUserUpdateMessage) {
    return !_.isEmpty(message.user["mailchimp/unique_email_id"]);
  }

  messageWithError(message: HullUserUpdateMessage) {
    return !_.isEmpty(message.user["mailchimp/import_error"]);
  }

  messageWhitelisted(message: HullUserUpdateMessage) {
    if (this.synchronizedSegments.length === 0) {
      return true;
    }
    return (
      _.intersectionBy(this.synchronizedSegments, message.segments, "id")
        .length > 0
    );
  }

  isAuthorized(): Promise<boolean> {
    return this.mailchimpClient
      .get("/")
      .then(response => {
        if (response.statusCode === 200) {
          return true;
        }
        return false;
      })
      .catch(() => {
        return false;
      });
  }

  isListPresent(): Promise<boolean> {
    return this.mailchimpClient
      .get("/lists/{{listId}}")
      .then(response => {
        if (response.statusCode === 200) {
          return true;
        }
        return false;
      })
      .catch(() => {
        return false;
      });
  }

  /**
   * This method is making sure that all static segments and all interest groups are present on Mailchimp end.
   * Also it makes sure that the webhook url is registered.
   */
  syncConnector({ forceCheck = false }: { forceCheck: boolean }): Promise<*> {
    debug("syncConnector", { forceCheck });
    return this.mailchimpAgent
      .ensureWebhookSubscription({
        hostname: this.hostname,
        client: this.client
      })
      .then(() =>
        this.segmentsMappingAgent.syncSegments(this.synchronizedSegments, {
          check: forceCheck
        })
      )
      .then(() => this.segmentsMappingAgent.updateMapping())
      .then(() =>
        this.interestsMappingAgent.ensureCategory({
          check: forceCheck
        })
      )
      .then(() =>
        this.interestsMappingAgent.syncInterests(this.synchronizedSegments, {
          check: forceCheck
        })
      )
      .then(() => this.interestsMappingAgent.updateMapping())
      .catch(err => {
        if (err.status === 400) {
          this.client.logger.error("connector.sync.error", {
            error: err.response.body.detail
          });
          return Promise.resolve("ok");
        }
        return Promise.reject(err);
      });
  }

  sendUserUpdateMessages(
    messages: Array<HullUserUpdateMessage>,
    { useSegments = false, ignoreFilter = false }: Object = {}
  ): Promise<*> {
    const startTime = process.hrtime();
    this.client.logger.debug("outgoing.job.start", {
      messages: messages.length
    });
    const envelopes: Array<IUserUpdateEnvelope> = messages
      .filter(message => {
        if (!_.isEmpty(message.user.email)) {
          return true;
        }
        this.client.asUser(message.user).logger.info("outgoing.user.skip", {
          reason: "doesn't have an email address"
        });
        return false;
      })
      .filter(message => {
        // TODO: extract to filter-util
        if (
          ignoreFilter ||
          this.synchronizedSegments.length === 0 ||
          _.intersectionBy(this.synchronizedSegments, message.segments, "id")
            .length > 0 ||
          _.intersectionBy(
            this.synchronizedSegments,
            _.get(message, "changes.segments.left", []),
            "id"
          ).length > 0
        ) {
          return true;
        }
        this.client.asUser(message.user).logger.info("outgoing.user.skip", {
          reason: "doesn't match whitelist"
        });
        return false;
      })
      .map(
        (message): IUserUpdateEnvelope => {
          return {
            message,
            // TODO: extract to attributes-mapper-util
            mailchimpNewMember: {
              email_type: "html",
              merge_fields: this.userMappingAgent.getMergeFields(message),
              interests: this.interestsMappingAgent.getInterestsForSegments(
                _.get(message, "segments", []).map(s => s.id)
              ),
              email_address: _.toString(message.user.email),
              status_if_new: "subscribed"
            },
            staticSegmentsToAdd: [],
            staticSegmentsToRemove: []
          };
        }
      )
      .map(envelope => {
        let segmentsToAdd: Array<HullUserSegment> = _.get(
          envelope,
          "message.changes.segments.entered",
          []
        );
        let segmentsToRemove: Array<HullUserSegment> = _.get(
          envelope,
          "message.changes.segments.left",
          []
        );
        if (useSegments === true) {
          segmentsToAdd = envelope.message.segments;
          if (this.forceRemovalFromStaticSegments === true) {
            segmentsToRemove = _.differenceBy(
              this.segments,
              segmentsToAdd,
              "id"
            );
          } else {
            segmentsToRemove = [];
          }
        }
        envelope.staticSegmentsToAdd = _.intersectionBy(
          this.synchronizedSegments,
          segmentsToAdd,
          "id"
        ).map(segment => this.segmentsMappingAgent.getAudienceId(segment.id));
        envelope.staticSegmentsToRemove = _.intersectionBy(
          this.synchronizedSegments,
          segmentsToRemove,
          "id"
        ).map(segment => this.segmentsMappingAgent.getAudienceId(segment.id));

        return envelope;
      });

    return this.syncConnector({ forceCheck: false })
      .then(() => this.mailchimpClient.upsertMembers(envelopes))
      .then(upsertedEnvelopes => {
        const envelopesToUpdate = upsertedEnvelopes.filter(envelope => {
          return !envelope.permanentError && !envelope.temporaryError;
        });
        envelopesToUpdate.map(envelope => {
          if (_.get(envelope, "mailchimpCurrentMember.status")) {
            const asUser = this.client.asUser(envelope.message.user);
            return asUser.traits({
              "mailchimp/status": _.get(
                envelope,
                "mailchimpCurrentMember.status"
              )
            });
          }
          return Promise.resolve();
        });
        return this.mailchimpClient
          .updateStaticSegments(envelopesToUpdate)
          .then(updatedEnvelopes => {
            const allEnvelopes = _.unionBy(
              upsertedEnvelopes,
              updatedEnvelopes,
              "message.user.id"
            );
            return allEnvelopes;
          });
      })
      .then(allEnvelopes => {
        const results = allEnvelopes.reduce(
          (res, envelope) => {
            const asUser = this.client.asUser(envelope.message.user);
            if (envelope.warning) {
              asUser.logger.warning("outgoing.user.warning", {
                warning: envelope.warning
              });
            }
            if (envelope.permanentError) {
              asUser.logger.error("outgoing.user.error", {
                error: envelope.permanentError
              });
              res.errors += 1;
            } else if (envelope.temporaryError) {
              asUser.logger.error("outgoing.user.error", {
                error: envelope.temporaryError
              });
              res.errors += 1;
            } else {
              asUser.logger.info("outgoing.user.success", {
                member: envelope.mailchimpNewMember
              });
              res.successes += 1;
            }
            return res;
          },
          { errors: 0, successes: 0 }
        );

        const hrTime = process.hrtime(startTime);
        const elapsed = hrTime[0] * 1000 + hrTime[1] / 1000000;
        this.metric.value("connector.send_user_update_messages.time", elapsed);
        this.metric.value(
          "connector.send_user_update_messages.messages",
          messages.length
        );
        this.metric.increment("ship.outgoing.users", results.successes);
        this.client.logger.debug("outgoing.job.success", results);
      });
  }

  /**
   * Trim down user traits for internal data flow.
   * Returns user object with traits which will be used
   * by ship in outgoing actions.
   *
   * @param {Object} user Hull user format
   * @return {Object} trimmed down user
   */
  filterUserData(user: Object) {
    const attrsToSync = _.concat(
      [
        "segment_ids",
        "first_name",
        "last_name",
        "id",
        "email",
        "remove_segment_ids"
      ],
      this.userMappingAgent.computeMergeFields().map(f => f.hull)
    );

    return _.pickBy(user, (v: any, k: string) => {
      return _.includes(attrsToSync, k) || k.match(/mailchimp/);
    });
  }

  increment(name: string, value: any) {
    if (this.metric) {
      this.metric.increment(name, value);
    }
  }
}

module.exports = SyncAgent;
