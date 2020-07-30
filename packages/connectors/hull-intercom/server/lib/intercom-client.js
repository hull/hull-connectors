const Promise = require("bluebird");
const superagent = require("superagent");
const SuperagentThrottle = require("superagent-throttle");
const prefixPlugin = require("superagent-prefix");
const _ = require("lodash");

const {
  superagentUrlTemplatePlugin,
  superagentInstrumentationPlugin,
  superagentErrorPlugin
} = require("hull/src/utils");
const { ConfigurationError, RateLimitError } = require("hull/src/errors");

const throttlePool = {};

class IntercomClient {
  constructor({ connector, client, metric }) {
    this.apiKey = _.get(connector, "private_settings.api_key");
    this.appId = _.get(connector, "private_settings.app_id");
    this.accessToken = _.get(connector, "private_settings.access_token");
    this.client = client;
    this.metric = metric;
    this.ship = connector;

    throttlePool[this.ship.id] =
      throttlePool[this.ship.id] ||
      new SuperagentThrottle({
        rate: parseInt(process.env.THROTTLE_RATE || 80, 10),
        ratePer: parseInt(process.env.THROTTLE_PER_RATE || 10500, 10),
        concurrent: parseInt(process.env.THROTTLE_CONCURRENT || 10, 10)
      });

    const throttle = throttlePool[this.ship.id];

    this.agent = superagent
      .agent()
      .use(
        prefixPlugin(
          process.env.OVERRIDE_INTERCOM_URL || "https://api.intercom.io"
        )
      )
      .use(request => {
        const originalThen = request.then;
        request.then = function then(resolve, reject) {
          return Promise.resolve(originalThen.call(request, resolve, reject));
        };
      })
      .accept("application/json")
      .use(superagentErrorPlugin({ timeout: 60000 }))
      .ok(res => {
        if (res.status === 401) {
          throw new ConfigurationError(res.text);
        }
        if (res.status === 429) {
          throw new RateLimitError(res.text);
        }
        return res.status < 400;
      })
      .on("response", res => {
        const limit = _.get(res.header, "x-ratelimit-limit");
        const remaining = _.get(res.header, "x-ratelimit-remaining");
        const reset = _.get(res.header, "x-ratelimit-reset");
        if (remaining !== undefined) {
          this.client.logger.debug("intercomClient.ratelimit", {
            remaining,
            limit,
            reset
          });
          this.metric.value("ship.service_api.remaining", remaining);
        }

        if (limit !== undefined) {
          this.metric.value("ship.service_api.limit", limit);
        }
      })
      .use(throttle.plugin(this.ship))
      .use(superagentUrlTemplatePlugin())
      .use(
        superagentInstrumentationPlugin({
          logger: this.client.logger,
          metric: this.metric
        })
      )
      .use(request => {
        const end = request.end;
        request.end = cb => {
          end.call(request, (err, res) => {
            if (err) {
              err.req = {
                url: _.get(err, "response.request.url"),
                method: _.get(err, "response.request.method"),
                data: _.get(err, "response.request._data")
              };
              err.body = _.get(err, "response.body");
              err.statusCode = _.get(err, "response.statusCode");
              delete err.response;
            }

            cb(err, res);
          });
        };
      });

    if (this.accessToken) {
      this.agent = this.agent.auth(this.accessToken);
    } else {
      this.agent = this.agent.auth(this.appId, this.apiKey);
    }
  }

  ifConfigured() {
    return (
      (!_.isEmpty(this.apiKey) && !_.isEmpty(this.appId)) ||
      !_.isEmpty(this.accessToken)
    );
  }

  get(url, query) {
    if (!this.ifConfigured()) {
      return Promise.reject(
        new ConfigurationError("Client access data not set!")
      );
    }
    return this.agent.get(url).query(query);
  }

  post(url, params) {
    if (!this.ifConfigured()) {
      return Promise.reject(
        new ConfigurationError("Client access data not set!")
      );
    }
    return this.agent.post(url).send(params);
  }

  delete(url, params) {
    if (!this.ifConfigured()) {
      return Promise.reject(
        new ConfigurationError("Client access data not set!")
      );
    }
    return this.agent
      .set("Accept", "application/json")
      .set("Intercom-Version", "2.1")
      .delete(url)
      .query(params);
  }

  getSegments() {
    if (!this.ifConfigured()) {
      return Promise.reject(
        new ConfigurationError("Client access data not set!")
      );
    }
    return this.agent.get("/segments");
  }

  /**
   * get total count of users
   */
  getContactsTotalCount() {
    return this.get("/contacts", { per_page: 1 })
      .then(response => {
        return _.get(response, "body.total_count");
      })
      .catch(err => {
        this.logger.error("getContactsTotalCount.error", err);
        return Promise.reject(err);
      });
  }
}

module.exports = IntercomClient;
