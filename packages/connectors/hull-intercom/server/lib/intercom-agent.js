// @flow
const _ = require("lodash");
const Promise = require("bluebird");
const moment = require("moment");

/**
 * Superset of Intercom API
 */
class IntercomAgent {
  constructor(intercomClient, { client, metric, cache }) {
    this.intercomClient = intercomClient;
    this.client = client;
    this.logger = client.logger;
    this.metric = metric;
    this.cache = cache;
  }

  getJob(id) {
    return this.intercomClient
      .get("/jobs/{{jobId}}")
      .tmplVar({
        jobId: id
      })
      .then(res => {
        const isCompleted =
          _.get(res, "body.tasks[0].state") === "completed" ||
          _.get(res, "body.tasks[0].state") === "completed_with_errors";

        const hasErrors =
          _.get(res, "body.tasks[0].state") === "completed_with_errors";

        return {
          isCompleted,
          hasErrors
        };
      });
  }

  /**
   * @see https://developers.intercom.com/reference#bulk-job-feeds
   * @param  {String} id
   * @return {Array} items param of the job feed
   */
  getJobErrors(id) {
    return this.intercomClient
      .get("/jobs/{{jobId}}/error")
      .tmplVar({
        jobId: id
      })
      .then(res => {
        return _.get(res, "body.items", []);
      });
  }

  importUsers(importType, params = {}) {
    const { scroll_param = null, updated_after, updated_before } = params;
    return this.intercomClient
      .get(`/${_.toLower(importType)}/scroll`, { scroll_param })
      .then(response => {
        let users = _.get(response.body, importType, []);
        const { scroll_param: next_scroll_param } = response.body;

        if (updated_after && moment(updated_after).isValid()) {
          users = users.filter(u => {
            return moment(u.updated_at, "X").isAfter(updated_after);
          });
        }

        if (updated_before && moment(updated_before).isValid()) {
          users = users.filter(u => {
            return moment(u.updated_at, "X").isBefore(updated_before);
          });
        }

        return { users, scroll_param: next_scroll_param };
      })
      .catch(err => {
        if (_.get(err, "body.errors[0].code") === "scroll_exists") {
          this.metric.event({
            title: "Trying to perform two separate scrolls"
          });
          return Promise.resolve([]);
        }
        if (_.get(err, "body.errors[0].code") === "not_found") {
          this.metric.event({ title: "Scroll expired, should start it again" });
          return Promise.resolve([]);
        }
        return Promise.reject(err);
      });
  }

  sendUsers(users, mode = "bulk") {
    if (_.isEmpty(users)) {
      this.logger.debug("sendUsers.emptyList");
      return Promise.resolve();
    }

    this.logger.debug("sendUsers", users.length);

    const body = {
      items: users.map(u => {
        this.logger.debug("outgoing.user.payload", u);
        return {
          method: "post",
          data_type: "user",
          data: u
        };
      })
    };

    if (
      users.length < (process.env.MINIMUM_BULK_SIZE || 10) ||
      mode === "regular"
    ) {
      return Promise.map(
        body.items,
        item => {
          return this.intercomClient
            .post("/users", item.data)
            .then(response => {
              return response.body;
            })
            .catch(err => {
              if (
                _.get(err, "body.errors[0].code") ===
                  "unique_user_constraint" ||
                _.get(err, "body.errors[0].code") === "conflict" ||
                _.get(err, "body.errors[0].code") === "not_restorable" ||
                _.get(err, "body.errors[0].code") === "not_found" ||
                _.get(err, "body.errors[0].code") === "server_error"
              ) {
                return err;
              }
              this.logger.error(
                "intercomAgent.sendUsers.microbatch.error",
                err
              );
              return Promise.reject(err);
            });
        },
        {
          concurrency:
            parseInt(process.env.USERS_API_REQUEST_CONCURRENCY, 10) || 10
        }
      );
    }

    return this.intercomClient.post("/bulk/users", body).catch(err => {
      this.logger.error("intercomAgent.sendUsers.bulkSubmit.error", err);
      return Promise.reject(err);
    });
  }

  tagUsers(ops) {
    const opArray = [];
    _.map(ops, (op, segmentName) => {
      this.logger.debug("intercomAgent.tagUsers", {
        segmentName,
        usersCount: op.length
      });
      opArray.push({
        name: segmentName,
        users: op
      });
    });
    return Promise.map(
      opArray,
      op => {
        return this.intercomClient.post("/tags", op).catch(err => {
          this.logger.error("intercomAgent.tagUsers.error", err);
          return Promise.reject(err);
        });
      },
      {
        concurrency: parseInt(process.env.TAG_API_REQUEST_CONCURRENCY, 10) || 1
      }
    );
  }

  /**
   * get total count of users
   */
  getUsersTotalCount() {
    return this.intercomClient
      .get("/users", { per_page: 1 })
      .then(response => {
        return _.get(response, "body.total_count");
      })
      .catch(err => {
        this.logger.error("getUsersTotalCount.error", err);
        return Promise.reject(err);
      });
  }

  getRecentLeads(options: Object): Object {
    const { page, count, updated_after, updated_before } = options;
    return this.intercomClient
      .get("/contacts", {
        per_page: count,
        page,
        order: "desc",
        sort: "updated_at"
      })
      .then(response => {
        const originalLeads = _.get(response, "body.contacts", []);
        const totalPages = _.get(response, "body.pages.total_pages");
        const leads = originalLeads
          .filter(u => {
            if (!updated_after || !moment(updated_after).isValid()) {
              return true;
            }
            return moment(u.updated_at, "X").isAfter(updated_after);
          })
          .filter(u => {
            if (!updated_before || !moment(updated_before).isValid()) {
              return true;
            }
            return moment(u.updated_at, "X").isBefore(updated_before);
          });

        return {
          hasMore: leads.length === originalLeads.length && page < totalPages,
          leads
        };
      })
      .catch(err => {
        this.client.logger.error("getRecentLeads.error", err);
        return Promise.reject(err);
      });
  }

  getRecentUsers(last_updated_at, count, page) {
    return this.intercomClient
      .get("/users", {
        per_page: count,
        page,
        order: "desc",
        sort: "updated_at"
      })
      .then(response => {
        const originalUsers = _.get(response, "body.users", []);
        const users = originalUsers.filter(u => {
          return moment(u.updated_at, "X").isAfter(last_updated_at);
        });
        this.logger.debug("getRecentUsers.count", {
          total: originalUsers.length,
          filtered: users.length
        });

        return {
          users,
          hasMore:
            !_.isEmpty(_.get(response, "body.pages.next")) &&
            users.length === originalUsers.length
        };
      })
      .catch(err => {
        this.logger.error("getRecentUsers.error", err);
        return Promise.reject(err);
      });
  }

  /**
   * @see https://developers.intercom.com/reference#event-model
   * @see https://developers.intercom.com/reference#bulk-event-ops
   * @see https://developers.intercom.com/reference#submitting-events
   * @return {Promise}
   * @param events
   * @param params
   */
  sendEvents(events, params = {}) {
    this.metric.increment("ship.outgoing.events", events.length);
    const { bulk = false } = params;
    if (!bulk || events.length <= 10) {
      // eslint-disable-line no-constant-condition
      return Promise.map(
        events,
        event => {
          return this.intercomClient.post("/events", event);
        },
        { concurrency: 1 }
      );
    }

    const wrappedEvents = events.map(e => {
      return {
        method: "post",
        data_type: "event",
        data: e
      };
    });

    const batches = _.chunk(wrappedEvents, 100);

    return Promise.map(
      batches,
      items => {
        return this.intercomClient
          .post("/bulk/events", { items })
          .then(({ body }) => {
            return this.intercomClient.get(body.links.error).then(res => {
              // FIXME: place to verify if the error still persists
              console.error(res.body.items[0].error);
            });
          });
      },
      { concurrency: 1 }
    );
  }

  getTags() {
    this.logger.debug("connector.getTags");
    return this.cache.wrap("intercomTags", () => {
      this.logger.debug("connector.getTags.cachemiss");
      // TODO check if /tags endpoint has pagination
      return this.intercomClient.get("/tags").then(res => {
        // console.log("TEST", res.body);
        return _.get(res, "body.tags", []);
      });
    });
  }

  deleteContact(id) {
    return this.intercomClient.delete(`/contacts/${id}`).then(response => {
      return response.body;
    });
  }

  deleteUser(deletePayload) {
    return this.intercomClient
      .post("/user_delete_requests", deletePayload)
      .then(response => {
        return response.body;
      });
  }

  getAttributes(intercomEntity = "customer") {
    this.logger.debug("connector.getAttributes");
    return this.intercomClient
      .get(`/data_attributes/${intercomEntity}`)
      .then(res => {
        return _.get(res, "body.data_attributes", []);
      })
      .catch(error => {
        console.log("error", error);
      });
  }
}

module.exports = IntercomAgent;
