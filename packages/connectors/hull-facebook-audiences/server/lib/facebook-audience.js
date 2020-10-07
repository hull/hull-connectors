const Promise = require("bluebird");
const _ = require("lodash");
const fbgraph = require("fbgraph");
const debug = require("debug")("hull-facebook-audiences");
const { ConfigurationError } = require("hull/src/errors");

const CAPABILITIES = require("./capabilities");
const CustomAudiences = require("./custom-audiences");

const ACCOUNT_FIELDS = [
  // "id",
  "account_id",
  "name"
  // "account_status",
  // "owner",
  // "capabilities",
  // "business"
  // "user_role"
];

const AUDIENCE_FIELDS_SIMPLE = ["description"];

const AUDIENCE_FIELDS = [
  "account_id",
  "approximate_count",
  "data_source",
  "delivery_status",
  "description",
  "excluded_custom_audiences",
  "external_event_source",
  "included_custom_audiences",
  "lookalike_spec",
  "name",
  "operation_status",
  "opt_out_link",
  "permission_for_actions",
  "pixel_id",
  "retention_days",
  "rule",
  "subtype",
  "time_content_updated",
  "time_created",
  "time_updated"
];

class FacebookAudience {
  /**
   * @param  {String} method supports `handleSegmentUpdate` and `handleSegmentDelete`
   * @return {Promise}
   */
  static handle(method) {
    return ({ client, ship, helpers, segments, metric }, message) => {
      const handler = new FacebookAudience(
        ship,
        client,
        helpers,
        segments,
        metric
      );
      if (!handler.isConfigured()) {
        return Promise.resolve({
          message: "Missing credentials, skipping"
        });
      }
      return handler[method](message);
    };
  }

  /**
   * Handles user Update
   * @param  {Object} options.message
   * @param  {Object} options.ship
   * @param  {Object} options.client
   * @param  {Object} options.helpers
   * @param  {Object} options.segments
   */
  static handleUserUpdate(
    { ship, client, helpers, segments, metric },
    messages = []
  ) {
    const agent = new FacebookAudience(ship, client, helpers, segments, metric);
    const filteredMessages = messages.reduce((acc, message) => {
      const { user, changes } = message;
      const asUser = client.asUser(_.pick(user, "id", "external_id", "email"));

      // Ignore if no changes on users' segments
      if (!changes || _.isEmpty(changes.segments)) {
        asUser.logger.debug("outgoing.user.skip", {
          reason: "no changes on users segments"
        });
        return acc;
      }

      // Reduce payload to keep in memory
      const payload = {
        user: _.pick(
          user,
          agent.customAudiences.getExtractFields(),
          "id",
          "external_id",
          "email"
        ),
        changes: _.pick(changes, "segments")
      };

      if (!agent.isConfigured()) {
        asUser.logger.debug("outgoing.user.skip", {
          reason: "connector is not configured"
        });
        return acc;
      }

      return acc.concat(payload);
    }, []);

    FacebookAudience.flushUserUpdates.call(this, agent, filteredMessages);
  }

  /**
   * Performs actions on users grouped by `handleUserUpdate` method.
   * It only works on segments saved in `synchronized_segments` setting
   * @param  {Object} agent     instance of FacebookAudience
   * @param  {Object} messages
   * @return {Promise}
   */
  static flushUserUpdates(agent, messages) {
    let segments = [];
    const operations = messages.reduce((ops, { user, changes }) => {
      if (changes && changes.segments) {
        const { entered, left } = changes.segments;
        segments = _.unionBy(segments, entered, left, "id");
        (entered || []).forEach(segment => {
          ops[segment.id] = ops[segment.id] || {
            segment,
            entered: [],
            left: []
          };
          ops[segment.id].entered.push(user);
        });
        (left || []).forEach(segment => {
          ops[segment.id] = ops[segment.id] || {
            segment,
            entered: [],
            left: []
          };
          ops[segment.id].left.push(user);
        });
      }
      return ops;
    }, {});

    return Promise.all(
      segments.map(s => agent.getOrCreateAudienceForSegment(s))
    )
      .then(() => agent.fetchAudiences())
      .then(audiences => {
        return Promise.all(
          _.map(operations, ({ segment, entered, left }) => {
            const promises = [];
            const audience = audiences[segment.id];
            let segmentIds = agent.ship.private_settings.synchronized_segments;
            if (
              agent.ship.private_settings.synchronized_segments_mapping &&
              agent.ship.private_settings.synchronized_segments_mapping
                .length &&
              agent.ship.private_settings.synchronized_segments_mapping.filter(
                entry => entry.segment_id
              ).length
            ) {
              segmentIds = agent.ship.private_settings.synchronized_segments_mapping.map(
                entry => entry.segment_id
              );
            }
            if (!audience || !_.includes(segmentIds, segment.id)) {
              _.map(messages, ({ user }) => {
                try {
                  agent.client.asUser(user).logger.debug("outgoing.user.skip", {
                    reason: `Segment ${segment.name} is not whitelisted`
                  });
                } catch (e) {} // eslint-disable-line no-empty
              });
              return {};
            }
            if (left.length > 0) {
              promises.push(agent.removeUsersFromAudience(audience.id, left));
            }
            if (entered.length > 0) {
              promises.push(agent.addUsersToAudience(audience.id, entered));
            }
            return Promise.all(promises).then(() => {
              return { audience, segment, entered, left };
            });
          })
        );
      })
      .catch(err => {
        let parsedError = err;
        const errorMessages = [];
        _.map(messages, ({ user }) => {
          const logPayload = { error: _.get(err, "message", "unknown") };
          if (err.type === "OAuthException" && err.is_transient === false) {
            logPayload.details = `${err.error_user_title} - ${err.error_user_msg}`;
          }
          if (err.hull_summary) {
            logPayload.details = err.hull_summary;
          }

          if (
            logPayload.details &&
            agent.ship.status.messages.indexOf(logPayload.details) === -1 &&
            errorMessages.indexOf(logPayload.details) === -1
          ) {
            errorMessages.push(logPayload.details);
          }
          agent.client
            .asUser(user)
            .logger.error("outgoing.user.error", logPayload);
        });

        if (err.error_subcode === 1870047) {
          // if we got `Audience Size too Low` error we do not fail the batch but continue and we do not publish status
          return Promise.resolve();
        }

        if (
          err.error_subcode === 1870034 || // Custom Audience Terms Not Accepted
          err.error_subcode === 460 || // Error validating access token
          err.error_subcode === 458 || // Error validating access token: The user has not authorized application 1234...
          err.error_subcode === 1870050 || // Business account required to create/edit
          err.error_subcode === 99 || // Unknown error has occurred
          err.error_subcode === 467 // Error validating access token
        ) {
          parsedError = new ConfigurationError(err.message, {
            code: err.code,
            error_user_msg: err.error_user_msg,
            error_user_title: err.error_user_title,
            is_transient: err.is_transient,
            error_subcode: err.error_subcode,
            fbtrace_id: err.fbtrace_id,
            type: err.type
          });
        }

        if (errorMessages.length > 0) {
          agent.client.put(`${agent.ship.id}/status`, {
            status: "error",
            messages: errorMessages
          });
        }

        return Promise.reject(parsedError);
      });
  }

  /**
   * Makes sure that the all synchronized segments have corresponding Custom Audiences.
   * While creating new ones, it will requests extracts for them.
   * @return {Promise}
   */
  sync() {
    const segments = this.getSynchronizedSegments();
    return this.fetchAudiences().then(audiences => {
      return Promise.all(
        segments.map(segment => {
          return audiences[segment.id] || this.createAudience(segment);
        })
      );
    });
  }

  getSynchronizedSegments() {
    let segmentsFromSettings = _.get(
      this.ship.private_settings,
      "synchronized_segments",
      []
    ).map(s => {
      return { id: s };
    });

    if (
      this.ship.private_settings.synchronized_segments_mapping &&
      this.ship.private_settings.synchronized_segments_mapping.length > 0 &&
      this.ship.private_settings.synchronized_segments_mapping.filter(
        entry => entry.segment_id
      ).length > 0
    ) {
      segmentsFromSettings = _.get(
        this.ship.private_settings,
        "synchronized_segments_mapping",
        []
      ).map(entry => {
        return { id: entry.segment_id };
      });
    }

    return _.intersectionBy(this.segments, segmentsFromSettings, "id");
  }

  constructor(ship, client, helpers, segments, metric) {
    this.ship = ship;
    this.client = client;
    this.customAudiences = new CustomAudiences(ship);
    this.helpers = helpers;
    this.segments = segments;
    this.metric = metric;
  }

  getAccessToken() {
    return _.get(this.ship, "private_settings.facebook_access_token");
  }

  getAccountId() {
    return _.get(this.ship, "private_settings.facebook_ad_account_id");
  }

  getManagerUrl(audience) {
    return `https://www.facebook.com/ads/manager/audiences/detail/?act=${this.getAccountId()}&pid=p3&ids=${
      audience.id
    }`;
  }

  getCredentials() {
    return {
      accessToken: this.getAccessToken(),
      accountId: this.getAccountId()
    };
  }

  isConfigured() {
    const { accessToken, accountId } = this.getCredentials();
    return !!(accessToken && accountId);
  }

  createAudience(segment, extract = true) {
    this.metric.increment("ship.audience.create", 1);
    debug("createAudience", this.ship.private_settings);
    if (
      !this.ship.private_settings ||
      !this.ship.private_settings.synchronized_segments_mapping
    ) {
      const err = new Error();
      err.hull_summary =
        "Missing `synchronized_segments_mapping` setting, we cannot create new custom audience. Please go to connector settings and fix it.";
      return Promise.reject(err);
    }

    const entry = _.find(
      this.ship.private_settings.synchronized_segments_mapping,
      { segment_id: segment.id }
    );

    if (!entry || !entry.customer_file_source) {
      const err = new Error(
        `Couldn't find a segments mapping entry for segment: ${segment.name}`
      );
      err.hull_summary = `Couldn't find a segments mapping entry for segment: ${segment.name}. Please go to connector settings and fix it.`;
      return Promise.reject(err);
    }

    return this.fb(
      "customaudiences",
      {
        subtype: "CUSTOM",
        customer_file_source: entry.customer_file_source,
        retention_days: 180,
        description: segment.id,
        name: `[Hull] ${segment.name}`
      },
      "post"
    ).then(audience => {
      if (extract) {
        this.helpers.extractRequest({
          segment,
          fields: this.customAudiences.getExtractFields(),
          additionalQuery: {
            audience: audience.id
          }
        });
      }
      return { isNew: true, ...audience });
    });
  }

  /**
   * Creates or returns information about Facebook Audience matching provided segment.
   * In case it gets segment which is not included in the `synchronized_segments`
   * setting it will return null
   * @param  {Object} segment
   * @return {Promise}
   */
  getOrCreateAudienceForSegment(segment) {
    const synchronizedSegmentIds = this.getSynchronizedSegments().map(
      s => s.id
    );
    if (!_.includes(synchronizedSegmentIds, segment.id)) {
      return Promise.resolve(null);
    }
    return this.fetchAudiences().then(audiences => {
      return audiences[segment.id] || this.createAudience(segment);
    });
  }

  handleSegmentUpdate(segment) {
    return this.getOrCreateAudienceForSegment(segment);
  }

  handleSegmentDelete(segment) {
    return this.fetchAudiences().then(audiences => {
      const audience = audiences[segment.id];
      return audience && this.fb(audience.id, {}, "del");
    });
  }

  removeUsersFromAudience(audienceId, users = []) {
    this.client.logger.debug("removeUsersFromAudience", {
      audienceId,
      users: users.map(u => u.email)
    });
    return this.updateAudienceUsers(audienceId, users, "del");
  }

  addUsersToAudience(audienceId, users = []) {
    this.client.logger.debug("addUsersToAudience", {
      audienceId,
      users: users.map(u => u.email)
    });
    return this.updateAudienceUsers(audienceId, users, "post");
  }

  updateAudienceUsers(audienceId, users, method) {
    const payload = this.customAudiences.buildCustomAudiencePayload(
      _.compact(users || [])
    );
    if (_.isEmpty(payload.data) || _.isEmpty(payload.schema)) {
      return Promise.resolve({ data: [] });
    }

    const params = { payload };
    const action = method === "del" ? "remove" : "add";
    this.metric.increment("ship.outgoing.users", payload.data.length);
    this.metric.increment(`ship.outgoing.users.${action}`, payload.data.length);
    this.client.logger.debug("updateAudienceUsers", {
      audienceId,
      payload,
      method
    });
    return this.fb(`${audienceId}/users`, params, method).then(() => {
      _.map(users, u => {
        this.client
          .asUser(_.pick(u, "id", "external_id", "email"))
          .logger.info("outgoing.user.success", { audienceId, method });
      });
    });
  }

  fb(path, params = {}, method = "get") {
    this.metric.increment("ship.service_api.call", 1);
    fbgraph.setVersion("7.0");
    const { accessToken, accountId } = this.getCredentials();
    if (!accessToken) {
      return Promise.reject(new ConfigurationError("MissingCredentials"));
    }
    return new Promise((resolve, reject) => {
      let fullpath = path;

      if (path.match(/^customaudiences/)) {
        if (!accountId) {
          return reject(new ConfigurationError("MissingAccountId"));
        }
        fullpath = `act_${accountId}/${path}`;
      }

      const fullparams = { ...params, access_token: accessToken }
      debug("fbgraph %o", { method, fullpath, fullparams });
      return fbgraph[method](fullpath, fullparams, (err, result) => {
        if (err) {
          this.metric.increment("connector.service_api.error", 1);
          this.client.logger.error("facebook.api.unauthorized", {
            method,
            fullpath,
            errors: err
          });
        }
        return err ? reject(err) : resolve(result);
      });
    });
  }

  fetchPixels(accountId) {
    return this.fb(`act_${accountId}/adspixels`, { fields: "name" });
  }

  fetchImages(accountId) {
    return this.fb(`act_${accountId}/adimages`, { fields: "url_128" });
  }

  fetchAvailableAccounts(params = {}) {
    const fields = ACCOUNT_FIELDS.join(",");
    return this.fb("me/adaccounts", { ...params, fields }).then(({ data }) => {
      const promises = [];
      data.map(account => {
        account.capabilities = _.compact(
          (account.capabilities || []).map(cap => CAPABILITIES[cap] || false)
        ).join(", ");

        const pix = this.fetchPixels(account.account_id)
          .then(pixels => {
            account.pixels = _.compact(
              (pixels.data || []).map(px => px.name)
            ).join(", ");
            return account;
          })
          .catch(err => {
            this.client.logger.warn("admin.fetchPixels", { errors: err });
            account.pixels = [];
          });
        promises.push(pix);

        const img = this.fetchImages(account.account_id)
          .then(images => {
            account.images = _.slice(
              (images.data || []).map(i => i.url_128),
              0,
              4
            );
            return account;
          })
          .catch(err => {
            this.client.logger.warn("admin.fetchImages", { errors: err });
            account.images = [];
          });
        promises.push(img);

        return account;
      });

      return Promise.all(promises).then(() => data);
    });
  }

  fetchAllAudiences(pageResult) {
    const promises = [];
    promises.push(Promise.resolve(pageResult.data));
    const { next } = pageResult.paging;
    if (next) {
      promises.push(
        this.fb("customaudiences", {
          fields: AUDIENCE_FIELDS_SIMPLE.join(","),
          limit: 500,
          after: pageResult.paging.cursors.after
        }).then(newPage => this.fetchAllAudiences(newPage))
      );
    }
    return Promise.all(promises);
  }

  fetchAudiences(pageSize = 500, paging = true) {
    return this.fb("customaudiences", {
      fields: AUDIENCE_FIELDS_SIMPLE.join(","),
      limit: pageSize
    })
      .then(pageResult => {
        if (paging && _.get(pageResult, "paging.next", false)) {
          return this.fetchAllAudiences(pageResult);
        }
        return pageResult.data;
      })
      .then(data => {
        data = _.flattenDeep(data);
        return data.reduce((audiences, a) => {
          const match = a.description && a.description.match(/[a-z0-9]{24}/i);
          const segmentId = match && match[0];
          if (segmentId) {
            audiences[segmentId] = a;
          }
          return audiences;
        }, {});
      });
  }

  fetchAudienceDetails(audienceID) {
    return this.fb(audienceID, {
      fields: AUDIENCE_FIELDS.join(",")
    }).then(data => {
      data.segmentId = data.description;
      return data;
    });
  }

  triggerExtractJob(segmentId) {
    this.client.logger.info("outgoing.job.start", { segmentId });
    const fields = this.customAudiences.getExtractFields();
    return this.getOrCreateAudienceForSegment({ id: segmentId })
      .then(audience => {
        if (audience === null) {
          return Promise.reject(
            new Error("You cannot resync a segment which is not whitelisted")
          );
        }
        return this.helpers.extractRequest({
          segment: { id: segmentId },
          additionalQuery: {
            audience: audience.id
          },
          fields
        });
      })
      .then(() => {
        this.client.logger.info("outgoing.job.success", { segmentId });
      })
      .catch(error => {
        this.client.logger.error("outgoing.job.error", {
          error: error.message
        });
      });
  }
}

module.exports = FacebookAudience;
