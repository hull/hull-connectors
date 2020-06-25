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

class SalesforceSDK {
  api: CustomApi;

  metricsClient: MetricAgent;

  loggerClient: HullClientLogger;

  helpers: Object;

  connectorId: string;

  syncAgent: Object;

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

  async getAllRecords({ type, fields }) {
    return this.syncAgent.sf.getAllRecords(
      type,
      _.merge({}, this.syncAgent.privateSettings, { fields } ),
      (record) => this.saveRecord({ type, record }));
  }

  async getUpdatedRecordIds({ type, fetchStart, fetchEnd }) {
    return this.syncAgent.sf.getUpdatedRecordIds(type, { start: fetchStart, end: fetchEnd });
  }

  async getDeletedRecordIds({ type, fetchStart, fetchEnd }) {
    return this.syncAgent.sf.getDeletedRecordIds(type, { start: fetchStart, end: fetchEnd })
  }

  async saveRecords({ type, ids, fields, executeQuery = "query" }) {
    return this.syncAgent.sf.getRecords(
      type,
      ids,
      _.merge({}, this.syncAgent.privateSettings, { fields, executeQuery } ),
      (record) => this.saveRecord({ type, record }));
  }

  async saveRecord({ type, record, progress = {} }) {
    return this.syncAgent[`save${type}`](record, progress);
  }

  async saveDeleted({ type, deletedRecords }) {
    return this.syncAgent.saveDeleted(type,  deletedRecords);
  }
}

const salesforceSDK: CustomApi = {
  initialize: (context, api) => new SalesforceSDK(context, api),
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

module.exports = salesforceSDK;
