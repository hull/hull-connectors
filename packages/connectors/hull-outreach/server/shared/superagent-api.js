/* @flow */
import type { RawRestApi } from "./types";
import type { HullClientLogger, HullMetrics, HullContext } from "hull";

const { Client } = require("hull");
const { doVariableReplacement } = require("./variable-utils");
const { isUndefinedOrNull } = require("./utils");

const { HullConnectorEngine } = require("./engine");

const _ = require("lodash");

const debug = require("debug")("hull-outreach:service-client");

const superagent = require("superagent");
const prefixPlugin = require("superagent-prefix");
const uri = require("urijs");

const {
  superagentUrlTemplatePlugin,
  superagentInstrumentationPlugin
} = require("hull/src/utils");

// const throttlePool = {};

// throttlePool[this.apiKey] =
//   throttlePool[this.apiKey] ||
//   new SuperagentThrottle({
//     rate: parseInt(process.env.THROTTLE_RATE, 10) || 40, // how many requests can be sent every `ratePer`
//     ratePer: parseInt(process.env.THROTTLE_RATE_PER, 10) || 1000 // number of ms in which `rate` requests may be sent
//   });
//
// const throttle = throttlePool[this.apiKey];

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

  async dispatch(endpointName: string, params: any) {
    this.metricsClient.increment("ship.service_api.call", 1);

    const endpoint = this.api.endpoints[endpointName];

    if (_.isEmpty(endpoint)) {
      debug(`Superagent endpoint does not exists: ${endpointName}`)
      return null;
    }

    let agentPromise = this.agent[endpoint.operation](doVariableReplacement(this.reqContext, endpoint.url));

    if (endpoint.query) {
      const query = doVariableReplacement(this.reqContext, endpoint.query);
      debug(`Created query: ${query}`);
      agentPromise = agentPromise.query(query);
    }

    if (!isUndefinedOrNull(params)) {
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
