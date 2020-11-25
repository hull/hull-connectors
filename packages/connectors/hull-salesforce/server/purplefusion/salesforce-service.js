/* @flow */
import type { HullClientLogger } from "hull";
import type { CustomApi } from "hull-connector-framework/src/purplefusion/types";

const moment = require("moment");

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

  async leadUpdate({ messages }) {
    return this.syncAgent.sendLeadMessages(messages);
  }

  async accountUpdate({ messages }) {
    return this.syncAgent.sendAccountMessages(messages);
  }

  async getFetchSoqlQuery({ sfType, fields, fetchDaysBack, lastFetchedAt }) {
    const identityClaims = this.syncAgent.getIdentityClaims({ sfType });
    let fetchToDate;
    if (fetchDaysBack && !lastFetchedAt) {
      fetchToDate = moment()
        .subtract({ days: fetchDaysBack })
        .toISOString();
    }
    if (lastFetchedAt) {
      fetchToDate = moment(lastFetchedAt, "x").toISOString();
    }
    return this.syncAgent.sf.getSoqlQuery({
      sfType,
      fields,
      identityClaims,
      fetchToDate
    });
  }

  async executeSoqlQuery(
    queryOptions: Object,
    retries: number = 3
  ): Promise<*> {
    return this.syncAgent.sf.queryAllRecords(queryOptions, retries);
  }

  async getDeletedRecords({ sfType, fetchStart, fetchEnd }) {
    return this.syncAgent.sf.getDeletedRecords(sfType, {
      start: fetchStart,
      end: fetchEnd
    });
  }

  // includes deleted records
  async queryAllById({ sfType, ids, fields }) {
    return this.syncAgent.sf.queryRecordsById(sfType, ids, fields, {
      queryScope: "queryAll"
    });
  }

  // does not include deleted records
  async queryExistingById({ sfType, ids, fields }) {
    return this.syncAgent.sf.queryRecordsById(sfType, ids, fields, {
      queryScope: "query"
    });
  }

  async insertRecords({ records, resource }) {
    return this.syncAgent.sf.insert(records, { resource });
  }

  async updateRecords({ records, resource }) {
    return this.syncAgent.sf.update(records, { resource });
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
      const asEntity =
        _.toLower(hullType) === "account"
          ? this.syncAgent.hullClient.asAccount(identity)
          : this.syncAgent.hullClient.asUser(identity);
      return asEntity.logger.info(`outgoing.${hullType}.${status}`, {
        records
      });
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
