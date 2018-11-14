/* @flow */
import type { RawRestApi } from "./types";
import type { HullClientLogger, HullMetrics, HullContext } from "hull";

const { Client } = require("hull");
const { doVariableReplacement } = require("./variable-utils");
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

class SuperagentApi {

  reqContext: Object;
  api: RawRestApi;
  agent: superagent;
  metricsClient: HullMetrics;
  loggerClient: HullClientLogger;
  connectorHostname: string;
  settingsUpdate: Object;
  engine: HullConnectorEngine;

  constructor(reqContext: Object, api: RawRestApi, engine: HullConnectorEngine) {
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
