/* @flow */
import type { RawRestApi } from "./types";
import type { HullClientLogger, HullMetrics, HullContext } from "hull";

const { Client } = require("hull");
const HullVariableContext = require("./variable-context");
const { isUndefinedOrNull } = require("./utils");

const _ = require("lodash");

const debug = require("debug")("hull-shared:service-client");

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

  globalContext: HullVariableContext;
  api: RawRestApi;
  agent: superagent;
  metricsClient: HullMetrics;
  loggerClient: HullClientLogger;
  connectorHostname: string;
  settingsUpdate: Object;

  constructor(globalContext: HullVariableContext, api: RawRestApi) {
    this.globalContext = globalContext;
    this.api = api;
    this.loggerClient = globalContext.reqContext().client.logger;
    this.metricsClient = globalContext.reqContext().metric;
    this.connectorHostname = globalContext.reqContext().hostname;
    this.settingsUpdate = globalContext.reqContext().helpers.settingsUpdate;
    const apiPrefix = globalContext.resolveVariables(api.prefix);

    this.agent = superagent
      .agent()
      .use(superagentUrlTemplatePlugin({}))
      .use(
        superagentInstrumentationPlugin({
          logger: this.loggerClient,
          metric: this.metricsClient
        })
      )
      .use(prefixPlugin(apiPrefix));


    const superAgentSettings = api.superagent.settings;

    // .set({ "Content-Type": "application/vnd.api+json" })
    _.forEach(superAgentSettings, (value) => {
      const method = this.globalContext.resolveVariables(value.method);
      const params = this.globalContext.resolveVariables(value.params)
      this.agent[method](params);
    });

    const headersToMetrics = api.superagent.headersToMetrics;

    if (!_.isEmpty(headersToMetrics)) {
      this.agent.on("response", res => {
        _.forEach(headersToMetrics, (value, key) => {
          const headerValue = _.get(res.header, key);
          if (typeof headerValue === 'number') {
            this.metricsClient.value(value, headerValue);
          } else if (typeof headerValue === 'string') {
            try {
              this.metricsClient.value(value, parseInt(headerValue, 10));
            } catch (err) {

            }
          }
        });
      });
    }
  }

  async dispatch(endpointName: string, params: any) {

    const endpoint = this.api.endpoints[endpointName];

    if (_.isEmpty(endpoint)) {
      debug(`Superagent endpoint does not exists: ${endpointName}`)
      return null;
    }

    _.forEach(endpoint.settings, (value) => {
      const method = this.globalContext.resolveVariables(value.method);
      const params = this.globalContext.resolveVariables(value.params);
      this.agent[method](params);
    });

    const url = this.globalContext.resolveVariables(endpoint.url);
    let agentPromise = this.agent[endpoint.operation](url);

    if (endpoint.query) {
      const query = this.globalContext.resolveVariables(endpoint.query);

      if (_.isObject(query)) {
        debug(`Created query: ${url}: ${JSON.stringify(query)}`);
      } else {
        debug(`Created query: ${url}: ${query}`);
      }

      agentPromise = agentPromise.query(query);
    }

    if (!isUndefinedOrNull(params)) {
      agentPromise = agentPromise.send(params);
    }

    if (endpoint.streamType)
      return { stream: agentPromise };

    return await agentPromise;

    // doing this a layer up for now because may need the full response
    // to detect and bubble errors
    // const returnObj = endpoint.returnObj;
    // if (!_.isEmpty(returnObj)) {
    //   return _.get(response, returnObj);
    // }

    // this may require us to do stuff a level up too...
    // return _.get(response, "body");

    // return response;
  }


}

module.exports = {
  SuperagentApi
};
