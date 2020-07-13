/* @flow */
import type { HullClientLogger, HullContext } from "hull";
import type {
  CustomApi,
  RawRestApi
} from "hull-connector-framework/src/purplefusion/types";

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

  getHullType({ sfType }) {
    switch (sfType) {
      case "Account": {
        return "Account";
      }

      case "Contact": {
        return "User";
      }

      case "Lead": {
        return "User";
      }

      case "Task": {
        return "Event";
      }

      default:
        return null;
    }
  }

  async dispatch(methodName: string, params: any) {
    return this[methodName](params);
  }

  async userUpdate({ messages }) {
    return this.syncAgent.sendUserMessages(messages);
  }

  async accountUpdate({ messages }) {
    return this.syncAgent.sendAccountMessages(messages);
  }

  async getAllRecords({ type, fields }) {
    return this.syncAgent.sf.getAllRecords(
      type,
      _.merge({}, this.syncAgent.privateSettings, { fields }),
      record => this.saveRecord({ type, record })
    );
  }

  async getUpdatedRecordIds({ type, fetchStart, fetchEnd }) {
    return this.syncAgent.sf.getUpdatedRecordIds(type, {
      start: fetchStart,
      end: fetchEnd
    });
  }

  async getDeletedRecords({ type, fetchStart, fetchEnd }) {
    return this.syncAgent.sf.getDeletedRecords(type, {
      start: fetchStart,
      end: fetchEnd
    });
  }

  async saveRecords({ type, ids, fields, executeQuery = "query" }) {
    return this.syncAgent.sf.getRecords(
      type,
      ids,
      _.merge({}, this.syncAgent.privateSettings, { fields, executeQuery }),
      record => this.saveRecord({ sfType: type, record })
    );
  }

  async saveRecord({ sfType, record, progress = {} }) {
    const hullType = this.getHullType({ sfType });
    return this.syncAgent[`save${hullType}`](
      { source: "salesforce", sfType },
      record
    );
  }

  async insertRecords({ records, resource }) {
    return this.syncAgent.sf.insert(records,{ resource });
  }

  async updateRecords({ records, resource }) {
    return this.syncAgent.sf.update(records,{ resource });
  }

  async querySalesforceRecords({ sfType, identifierKey, event_ids }) {
    return this.syncAgent.sf.queryExistingRecords(
      sfType,
      identifierKey,
      event_ids
    );
  }

  async logOutgoing({ status, records, identity, hullType }) {
    if (!_.isEmpty(records)) {
      const asEntity = hullType === "account" ?
        this.syncAgent.hullClient.asAccount(identity) :
        this.syncAgent.hullClient.asUser(identity);
      return asEntity.logger.info(`outgoing.${hullType}.${status}`, { records });
    }
    return Promise.resolve();
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
