/* @flow */
import type { HullClientLogger } from "hull";
import type {
  CustomApi
} from "hull-connector-framework/src/purplefusion/types";


const MetricAgent = require("hull/src/infra/instrumentation/metric-agent");

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

  async userUpdate({ messages }) {
    return this.syncAgent.sendUserMessages(messages);
  }

  async accountUpdate({ messages }) {
    return this.syncAgent.sendAccountMessages(messages);
  }

  async getAllRecords({ sfType, fields, fetchDaysBack, lastFetchedAt }) {
    const identityClaims = this.syncAgent.getIdentityClaims({ sfType });
    return this.syncAgent.sf.getAllRecords(
      sfType,
      { identityClaims, fields, fetchDaysBack, lastFetchedAt },
      record => this.saveRecord({ sfType, record })
    );
  }

  async getDeletedRecords({ sfType, fetchStart, fetchEnd }) {
    return this.syncAgent.sf.getDeletedRecords(sfType, {
      start: fetchStart,
      end: fetchEnd
    });
  }

  async saveRecords({ sfType, ids, fields, executeQuery = "query" }) {
    const identityClaims = this.syncAgent.getIdentityClaims({ sfType });
    return this.syncAgent.sf.getRecords(
      sfType,
      ids,
      { identityClaims, fields, executeQuery },
      record => this.saveRecord({ sfType, record })
    );
  }

  async saveRecord({ sfType, record, progress = {} }) {
    return this.syncAgent[`save${sfType}`](
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
      const asEntity = _.toLower(hullType) === "account" ?
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
