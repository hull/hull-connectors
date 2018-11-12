/* @flow */
import type { RawRestApi } from "./types";
import type { HullClientLogger, HullMetrics, HullContext } from "hull";

const { Client } = require("hull");
const { doVariableReplacement } = require("./utils");

const _ = require("lodash");

const debug = require("debug")("hull-outreach:service-client");

const superagent = require("superagent");
const prefixPlugin = require("superagent-prefix");
const uri = require("urijs");

const {
  superagentUrlTemplatePlugin,
  superagentInstrumentationPlugin
} = require("hull/src/utils");

class SuperagentApi {

  reqContext: Object;
  api: RawRestApi;
  agent: superagent;
  metricsClient: HullMetrics;
  loggerClient: HullClientLogger;
  connectorHostname: string;
  settingsUpdate: Object;

  constructor(reqContext: Object, api: RawRestApi) {
    this.reqContext = reqContext;
    this.api = api;
    this.loggerClient = reqContext.client.logger;
    this.metricsClient = reqContext.metric;
    this.connectorHostname = reqContext.hostname;
    this.settingsUpdate = reqContext.helpers.settingsUpdate;

    this.agent = superagent
      .agent()
      .use(superagentUrlTemplatePlugin({}))
      .use(
        superagentInstrumentationPlugin({
          logger: this.loggerClient,
          metric: this.metricsClient
        })
      )
      .use(prefixPlugin(api.prefix));


    const superAgentSettings = api.superagent.settings;

    // .set({ "Content-Type": "application/vnd.api+json" })
    _.forEach(superAgentSettings, (value) => {
      const method = doVariableReplacement(reqContext, value.method);
      const params = doVariableReplacement(reqContext, value.params);
      console.log("Method: " + method);
      console.log("Params: " + params);
      this.agent[method](params);
    });

    const authentication = api.authentication;
    // .set("Authorization", `Bearer ${this.accessToken}`)

    const headersToMetrics = api.superagent.headersToMetrics;

    if (!_.isEmpty(headersToMetrics)) {
      this.agent.on("response", res => {
        _.forEach(headersToMetrics, (value, key) => {
          const headerValue = _.get(res.header, key);
          if (typeof headerValue === 'number') {
            this.metricsClient.value(value, headerValue);
          }
        });
      });
    }
  }

  /**
   * This is a wrapper which we can use to handle http errors
   * can be used for timeouts, token refreshes etc...
   *
   * @param {Promise} promise
   */
  agentErrorHandler(promise: () => Promise<mixed>): Promise<*> {
    return promise().catch(error => {

      if (error.status === 401) {
        if (_.isEmpty(this.accessToken)) {
          this.loggerClient.error(
            "Not authorized with Outreach yet, please authenticate with Outreach using the Credentials button on the settings page"
          );
        } else {
          this.loggerClient.error(
            "API AccessToken no longer valid, please authenticate with Outreach again using the Credentials button on the settings page"
          );
        }
      } else {
        this.loggerClient.error(
          `Received ${
            error.status
          } Error code while connecting with the Outreach API, please contact Hull support`
        );
        this.loggerClient.debug(
          `Received ${
            error.status
          } Error code while connecting with the Outreach API, please contact Hull support, ${JSON.stringify(
            error
          )}`
        );
      }
    })
  }

  async dispatch(endpointName: string, params: any) {
    this.metricsClient.increment("ship.service_api.call", 1);

    const endpoint = this.api.endpoints[endpointName];

    let agentPromise = this.agent[endpoint.operation](endpoint.url);

    if (endpoint.query) {
      agentPromise = agentPromise.query(doVariableReplacement(this.reqContext, endpoint.query));
    }

    if (params !== undefined && params !== null) {
      agentPromise = agentPromise.send(params);
    }

    const response = await agentPromise;

    const returnObj = endpoint.returnObj;
    if (!_.isEmpty(returnObj)) {
      return _.get(response, returnObj);
    }

    return _.get(response, "body");
  }


}

module.exports = {
  SuperagentApi
};
