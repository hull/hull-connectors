/* @flow */
import type {
  IServiceClient,
  IApiResultObject,
  IInsertUpdateOptions,
  ILogger,
  IMetricsClient,
  ISalesforceClientOptions,
  TApiOperation,
  TDeletedRecordInfo,
  TDeletedRecordsParameters,
  THullObject,
  TInsertUpdateOptions,
  TResourceType,
  TResourceTypeAssignmentRule
} from "./types";

import type { TAssignmentRule } from "./service-client/assignmentrules";

const _ = require("lodash");
const events = require("events");
const Promise = require("bluebird");
const moment = require("moment");

const Connection = require("./service-client/connection");
const {
  executeApiOperationSoap
} = require("./service-client/execute-apioperation");
const { find } = require("./service-client/find");
const getAssignmentRules = require("./service-client/assignmentrules");
const QueryUtil = require("./sync-agent/query-util");

const CONNECTION_EVENTS = [
  "request.sent",
  "request.usage",
  "request.error",
  "refresh",
  "error"
];

// We cannot go higher than 750 because the SOQL query has a limit of 20k characters;
// each ID has between 14 and 16 characters, plus 2 characters for ' escape characters plus delimiter
// plus about 50 characters of overhead.
const FETCH_CHUNKSIZE = Math.min(
  parseInt(process.env.FETCH_CHUNKSIZE, 10) || 500,
  750
);

class ServiceClient extends events.EventEmitter implements IServiceClient {
  /**
   * Gets or sets the connection to use.
   *
   * @type {Connection}
   * @memberof SalesforceClient
   */
  connection: Connection;

  /**
   * Gets or sets the logger
   *
   * @type {ILogger}
   * @memberof SalesforceClient
   */
  logger: ILogger;

  /**
   * Gets or sets the metrics client.
   *
   * @type {IMetricsClient}
   * @memberof SalesforceClient
   */
  metricsClient: IMetricsClient;

  queryUtil: QueryUtil;

  /**
   * Creates an instance of SalesforceClient.
   * @param {ISalesforceClientOptions} options The configuration options.
   * @memberof SalesforceClient
   */
  constructor(options: ISalesforceClientOptions) {
    super();
    const connection = new Connection(options.connection);
    connection.setLogger(options.logger);
    connection.setMetric(options.metrics);
    // re-emit connection events upstream
    CONNECTION_EVENTS.forEach(e =>
      connection.on(e, this.emit.bind(this, `connection.${e}`))
    );
    this.connection = connection;
    this.logger = options.logger;
    this.metricsClient = options.metrics;
    this.queryUtil = new QueryUtil();
  }

  getSoqlQuery({
    sfType,
    fields,
    identityClaims,
    fetchToDate
  }): {
    type: TResourceType,
    fields: Array<string>,
    identityClaims: Array<Object>,
    fetchToDate: string
  } {
    const { selectFields, requiredFields } = this.queryUtil.getSoqlFields(
      sfType,
      fields,
      identityClaims
    );

    let query = `SELECT ${selectFields} FROM ${_.upperFirst(
      sfType
    )} WHERE Id != NULL`;

    if (!_.isNil(fetchToDate)) {
      query += ` AND LastModifiedDate >= ${fetchToDate}`;
    }

    if (!_.isNil(requiredFields) && requiredFields.length > 0) {
      for (let i = 0; i < requiredFields.length; i += 1) {
        const requiredField = requiredFields[i];
        query += ` AND ${requiredField} != null`;
      }
    }

    query += " ORDER BY LastModifiedDate DESC";

    return query;
  }

  /**
   * Finds the records by Id via SOQL query which has a high limit.
   */
  queryRecordsById(
    sfType: TResourceType,
    ids: string[],
    fields: string[],
    options: Object = {}
  ): Promise<any[]> {
    const queryScope = _.get(options, "queryScope", "query");
    const idsList = ids.map(id => `'${id}'`).join(",");
    const query = `SELECT ${fields.join(",")} FROM ${_.upperFirst(
      sfType
    )} WHERE Id IN (${idsList})`;

    return this.exec(queryScope, query).then(({ records }) => records);
  }

  /**
   * Executes the insert operation against the Salesforce API.
   *
   * @param {Array<THullObject>} records The records to insert/create in Salesforce.
   * @param {TInsertUpdateOptions} options The options to execute the operation.
   * @returns {Promise<IApiResultObject[]>} A list of result objects.
   * @memberof SalesforceClient
   */
  insert(
    records: Array<THullObject>,
    options: IInsertUpdateOptions
  ): Promise<IApiResultObject[]> {
    if (records.length === 0) {
      return Promise.resolve([]);
    }

    return Promise.map(_.chunk(records, 200), chunkOfRecords => {
      const ops: TApiOperation = {
        method: "insert",
        resource: options.resource,
        records: chunkOfRecords
      };

      if (
        !_.isNil(options.leadAssignmentRule) &&
        _.isString(options.leadAssignmentRule)
      ) {
        _.set(ops, "leadAssignmentRule", options.leadAssignmentRule);
      }

      this.metricsClient.increment("ship.service_api.call", 1);
      return executeApiOperationSoap(this.connection, ops);
      // FIXME: Handle conn.limitInfo to log metrics for ship.service_api.remaining and ship.service_api.limit
    }).then(_.flatten);
  }

  /**
   * Executes the update operation against the Salesforce API.
   *
   * @param {Array<THullObject>} records The records to update in Salesforce.
   * @param {TInsertUpdateOptions} options The options to execute the operation.
   * @returns {Promise<IApiResultObject[]>} A list of result objects.
   * @memberof SalesforceClient
   */
  update(
    records: Array<THullObject>,
    options: TInsertUpdateOptions
  ): Promise<IApiResultObject[]> {
    if (records.length === 0) {
      return Promise.resolve([]);
    }

    return Promise.map(_.chunk(records, 200), chunkOfRecords => {
      const ops: TApiOperation = {
        method: "update",
        resource: options.resource,
        records: chunkOfRecords
      };

      if (
        !_.isNil(options.leadAssignmentRule) &&
        _.isString(options.leadAssignmentRule)
      ) {
        _.set(ops, "leadAssignmentRule", options.leadAssignmentRule);
      }

      this.metricsClient.increment("ship.service_api.call", 1);
      return executeApiOperationSoap(this.connection, ops);
      // FIXME: Handle conn.limitInfo to log metrics for ship.service_api.remaining and ship.service_api.limit
    }).then(_.flatten);
  }

  /**
   * Fetches the list of fields for the given resource.
   *
   * @param {TResourceType} type The type of resource.
   * @returns {any} An object containing the list of fields.
   * @memberof SalesforceClient
   */
  fetchFieldsList(type: TResourceType): any {
    return this.exec("describe", type).then(meta => {
      return meta.fields.reduce((fields, f) => {
        const fi = _.merge({}, fields, { [f.name]: f });
        return fi;
      }, {});
    });
  }

  fetchResourceSchema(type: TResourceType, fieldTypes: string): any {
    return this.exec("describe", type).then(meta => {
      return _.reduce(
        _.filter(meta.fields, field => {
          return _.includes(fieldTypes, field.type);
        }),
        (fields, f) => {
          return _.merge({}, fields, { [f.name]: f.type });
        },
        {}
      );
    });
  }

  /**
   * Retrieves assignment rules for the specified object type.
   *
   * @param {TAssignmentRuleObjectType} type The object type to retrieve assignment rules for.
   * @returns {Promise<TAssignmentRule[]>} A Promise that wraps an array of assignment rules.
   * @memberof SalesforceClient
   */
  fetchAssignmentRules(
    type: TResourceTypeAssignmentRule
  ): Promise<TAssignmentRule[]> {
    return getAssignmentRules(this.connection, type);
  }

  /**
   * Finds all matching leads within Salesforce.
   *
   * @param {*} query A MongoDB like query.
   * @param {string[]} fields The fields to return from the query.
   * @param {number} limit The number of records to retrieve.
   * @param {number} skip The number of records to skip, used for pagination.
   * @returns {Promise<any[]>} A list of leads.
   * @memberof SalesforceClient
   */
  findLeads(
    query: any,
    fieldsList: string[],
    limit: number = 10000,
    skip: number = 0
  ): Promise<any[]> {
    if (_.isEmpty(query)) return Promise.resolve([]);
    const fields = _.fromPairs(fieldsList.map(f => [f, 1]));
    return find(this.connection, "Lead", query, fields, limit, skip);
  }

  /**
   * Finds all matching contacts within Salesforce.
   *
   * @param {*} query A MongoDB like query.
   * @param {string[]} fields The fields to return from the query.
   * @param {number} limit The number of records to retrieve.
   * @param {number} skip The number of records to skip, used for pagination.
   * @returns {Promise<any[]>} A list of contacts.
   * @memberof SalesforceClient
   */
  findContacts(
    query: any,
    fieldsList: string[],
    limit: number = 10000,
    skip: number = 0
  ): Promise<any[]> {
    if (_.isEmpty(query)) return Promise.resolve([]);
    const fields = _.fromPairs(fieldsList.map(f => [f, 1]));
    return find(this.connection, "Contact", query, fields, limit, skip);
  }

  /**
   * Finds all matching accounts within Salesforce.
   *
   * @param {*} query A MongoDB like query.
   * @param {string[]} fields The fields to return from the query.
   * @param {number} limit The number of records to retrieve.
   * @param {number} skip The number of records to skip, used for pagination.
   * @returns {Promise<any[]>} A list of accounts.
   * @memberof SalesforceClient
   */
  findAccounts(
    query: any,
    fieldsList: string[],
    limit: number = 10000,
    skip: number = 0
  ): Promise<any[]> {
    if (_.isEmpty(query)) return Promise.resolve([]);
    const fields = _.fromPairs(fieldsList.map(f => [f, 1]));
    return find(this.connection, "Account", query, fields, limit, skip);
  }

  /**
   * Finds all matching objects within Salesforce.
   */
  async queryExistingRecords(
    type: string,
    sfdcId: string,
    recordIds: string[]
  ): Promise<any[]> {
    const params = {};
    _.set(params, sfdcId, { $in: recordIds });
    return this.connection.sobject(type).find(params);
  }

  /**
   * Executes the given function using the connection.
   *
   * @param {string} fn The name of the function.
   * @param {...any} args The arguments of the function.
   * @returns {Promise<any>} A Promise holding the result.
   * @memberof SalesforceClient
   */
  exec(fn: string, ...args: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.connection[fn].apply(this.connection, [
        ...args,
        (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        }
      ]);
    });
  }

  async saveRecords(records, onRecord) {
    const chunks = _.chunk(records, FETCH_CHUNKSIZE);
    await Promise.map(chunks, async chunk => {
      return Promise.all(chunk.map(record => onRecord(record)));
    });
  }

  async getAllRecords(
    sfType: TResourceType,
    options: Object = {},
    onRecord: Function
  ): Promise<*> {
    const {
      fields = [],
      identityClaims = [],
      fetchDaysBack,
      lastFetchedAt
    } = options;
    let fetchToDate;
    if (fetchDaysBack && !lastFetchedAt) {
      fetchToDate = moment()
        .subtract({ days: fetchDaysBack })
        .toISOString();
    }
    if (lastFetchedAt) {
      fetchToDate = moment(lastFetchedAt, "x").toISOString();
    }
    const query = this.getSoqlQuery({
      sfType,
      fields,
      identityClaims,
      fetchToDate
    });
    return this.fetchRecords({ query }, sfType, onRecord);
  }

  async fetchRecords(
    queryOptions: Object,
    sfType: string,
    onRecord: Function,
    fetchProgress: Object = {}
  ) {
    let { progress = 0, totalSize } = fetchProgress;
    const retries = 3;
    const result = await this.queryAllRecords(queryOptions, retries);

    if (_.isNil(result) || _.isEmpty(result)) {
      return Promise.reject(new Error("Salesforce Result Set Not Found"));
    }

    const { done, nextRecordsUrl, records } = result;

    if (!totalSize) {
      totalSize = result.totalSize;
    }

    progress += _.size(records);
    this.logger.info("incoming.job.progress", {
      jobName: `fetch-${_.toLower(sfType)}s`,
      progress: `${progress} / ${totalSize}`
    });

    await this.saveRecords(records, onRecord);

    if (!done && nextRecordsUrl) {
      return this.fetchRecords({ nextRecordsUrl }, sfType, onRecord, {
        progress,
        totalSize
      });
    }

    return Promise.resolve("done");
  }

  queryAllRecords(queryOptions: Object, retries: number): Promise<*> {
    const { query, nextRecordsUrl } = queryOptions;
    try {
      return _.isNil(nextRecordsUrl)
        ? this.connection.query(query)
        : this.connection.queryMore(nextRecordsUrl);
    } catch (error) {
      if (retries > 0) {
        this.logger.info("incoming.job.progress", {
          retries,
          retry: _.isNil(nextRecordsUrl) ? query : nextRecordsUrl
        });
        retries -= 1;
        return this.queryAllRecords(queryOptions, retries);
      }
      return Promise.reject(error);
    }
  }

  getDeletedRecords(
    sfType: TResourceType,
    options: TDeletedRecordsParameters
  ): Promise<Array<TDeletedRecordInfo>> {
    const start = options.start
      ? new Date(options.start)
      : new Date(new Date().getTime() - 360 * 1000);
    const end = options.end ? new Date(options.end) : new Date();

    return this.connection
      .sobject(_.upperFirst(sfType))
      .deleted(start, end)
      .then(recordsInfo => {
        return _.get(recordsInfo, "deletedRecords", []);
      });
  }
}

module.exports = ServiceClient;
