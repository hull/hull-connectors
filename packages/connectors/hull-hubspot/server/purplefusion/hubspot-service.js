/* @flow */
import type { HullClientLogger, HullContext } from "hull";
import type { CustomApi, RawRestApi } from "hull-connector-framework/src/purplefusion/types";

const {
  isUndefinedOrNull
} = require("hull-connector-framework/src/purplefusion/utils");

const MetricAgent = require("hull/src/infra/instrumentation/metric-agent");
const { Client } = require("hull");

const { SkippableError, ConfigurationError } = require("hull/src/errors");

const _ = require("lodash");
const HullVariableContext = require("hull-connector-framework/src/purplefusion/variable-context");
const SyncAgent = require("../lib/sync-agent");


const synchOptions = {
  logging: false,
  alter: true
};

class HubspotSdk {
  api: CustomApi;

  metricsClient: MetricAgent;

  loggerClient: HullClientLogger;

  helpers: Object;

  connectorId: string;

  syncAgent: object;

  constructor(globalContext: HullVariableContext, api: CustomApi) {
    const reqContext = globalContext.reqContext();
    this.api = api;
    this.loggerClient = reqContext.client.logger;
    this.metricsClient = reqContext.metric;
    this.helpers = reqContext.helpers;
    this.connectorId = reqContext.connector.id;
    this.syncAgent = new SyncAgent(reqContext);
  }

  async dispatch(methodName: string, params: any) {
    return this[methodName](params);
  }

  async saveContacts(contacts) {
    await this.syncAgent.initialize();
    return this.syncAgent.saveContacts(contacts);
  }

  async saveCompanies(companies) {
    await this.syncAgent.initialize();
    return this.syncAgent.saveCompanies(companies);
  }

  // async getRecentContactsPage() {
  //   return this.syncAgent.getRecentContactsPage();
  // }

  async getContactPropertiesKeys() {
    await this.syncAgent.initialize();
    return this.syncAgent.getContactPropertiesKeys();
  }

}

const hubspotSdk: CustomApi = {
  initialize: (context, api) => new HubspotSdk(context, api),
  error: {
    templates: [
      {
        truthy: { name: "ConfigurationError" },
        errorType: ConfigurationError,
        message: "Configuration Error"
      },
      {
        truthy: { name: "ErrorTemplateMessage" },
        errorType: SkippableError,
        message: "Error description message"
      }
    ]
  }
};

module.exports = hubspotSdk;
