/* @flow */
import type {
  IApiResultObject,
  TApiMethod,
  TApiOperation,
  TResourceType,
  THullObject
} from "../types";

const Promise = require("bluebird");
const _ = require("lodash");

const Connection = require("./connection");

class ApiResultObject implements IApiResultObject {
  resource: TResourceType;

  record: THullObject;

  method: TApiMethod;

  success: boolean;

  error: ?string | string[] | null;

  constructor(
    resource: TResourceType,
    record: THullObject,
    method: TApiMethod
  ) {
    this.method = method;
    this.resource = resource;
    this.record = record;
    this.error = null;
    this.success = true;
  }
}

/**
 * Handles the response from the Salesforce API and creates result objects.
 *
 * @param {TApiOperation} operation Information about the API operation to perform.
 * @param {(any|any[])} response The response from the Salesforce API.
 * @returns {IApiResultObject[]} A list of result objects.
 */
function handleResponse(
  operation: TApiOperation,
  response: Object | Array<Object>
): IApiResultObject[] {
  const result = [];
  if (_.isArray(response)) {
    // $FlowFixMe
    _.forEach(response, (r: Object, i) => {
      const hullObj = _.cloneDeep(operation.records[i]);

      if (r.success === true || r.success === "true") {
        _.set(hullObj, "Id", r.id);
      }

      const resObj: IApiResultObject = new ApiResultObject(
        operation.resource,
        hullObj,
        operation.method
      );

      if (r.success === false || r.success === "false") {
        resObj.error = r.errors;
        resObj.success = false;
      }

      result.push(resObj);
    });
  } else {
    const hullObj = _.cloneDeep(operation.records[0]);

    if (response.success === true || response.success === "true") {
      _.set(hullObj, "Id", (response: any).id);
    }

    const resObj: IApiResultObject = new ApiResultObject(
      operation.resource,
      hullObj,
      operation.method
    );

    if (
      response.success === false ||
      response.success === "false" ||
      (response && response.errors)
    ) {
      resObj.error = (response: any).errors;
      resObj.success = false;
    }

    result.push(resObj);
  }

  return result;
}

/**
 * Exectues an operation against the Salesforce API using the Bulk API.
 *
 * @export
 * @param {Connection} conn The connection to use for communication with the Salesforce API.
 * @param {TApiOperation} operation Information about the API operation to perform.
 * @returns {Promise<IApiResultObject[]>} Returns a list of results.
 */
function executeApiOperationBulk(
  conn: Connection,
  operation: TApiOperation
): Promise<IApiResultObject[]> {
  if (!_.has(operation, "records.length") || operation.records.length === 0) {
    return Promise.resolve([]);
  }
  const options = {};
  // External ID field is not valid for insert operation, skip it:
  if (operation.method !== "insert") {
    _.set(options, "extIdField", operation.externalIDFieldName);
  }
  // Lead assignment rule header is only valid for leads and defaults to `none` which needs to be treated as not set:
  if (
    operation.resource === "Lead" &&
    !_.isNil(operation.leadAssignmentRule) &&
    operation.leadAssignmentRule !== "none"
  ) {
    _.set(options, "assignmentRuleId", operation.leadAssignmentRule);
  }
  const obj = conn.sobject(operation.resource);

  return new Promise((resolve, reject) => {
    obj.bulkload(operation.method, options, operation.records, (err, res) => {
      if (err) {
        return reject(err);
      }
      return resolve(handleResponse(operation, res));
    });
  });
}

/**
 * Exectues an operation against the Salesforce API using the Partner SOAP API.
 *
 * @export
 * @param {Connection} conn The connection to use for communication with the Salesforce API.
 * @param {TApiOperation} operation Information about the API operation to perform.
 * @returns {Promise<IApiResultObject[]>} Returns a list of results.}
 */
function executeApiOperationSoap(
  conn: Connection,
  operation: TApiOperation
): Promise<IApiResultObject[]> {
  if (!_.has(operation, "records.length") || operation.records.length === 0) {
    return Promise.resolve([]);
  }

  const sObjects = operation.records.map(record => ({
    type: operation.resource,
    ...record
  }));
  // Note: Order of the payload properties is important, otherwise SOAP call will fail.
  const payload = {};
  if (operation.method === "upsert") {
    _.set(payload, "externalIDFieldName", operation.externalIDFieldName);
  }
  _.set(payload, "sObjects", sObjects);
  let customHeaders = null;
  if (
    operation.resource === "Lead" &&
    !_.isNil(operation.leadAssignmentRule) &&
    operation.leadAssignmentRule !== "none"
  ) {
    customHeaders = {
      AssignmentRuleHeader: { assignmentRuleId: operation.leadAssignmentRule }
    };
  }

  const soapMethod =
    operation.method === "insert" ? "create" : operation.method;

  return new Promise((resolve, reject) => {
    conn.soap._invoke(
      soapMethod,
      payload,
      null,
      (err, res) => {
        if (err) {
          return reject(err);
        }
        return resolve(handleResponse(operation, res));
      },
      customHeaders
    );
  });
}

/**
 * Executes an operation against the Salesforce API, using either SOAP or Bulk API if more than 200 records.
 *
 * @export
 * @param {Connection} conn The connection to use for communication with the Salesforce API.
 * @param {TApiOperation} operation Information about the API operation to perform.
 * @returns {Promise<IApiResultObject[]>} Returns a list of results.
 */
function executeApiOperation(
  conn: Connection,
  operation: TApiOperation
): Promise<IApiResultObject[]> {
  if (!_.has(operation, "records.length") || operation.records.length === 0) {
    return Promise.resolve([]);
  }

  if (operation.records.length > 200) {
    return executeApiOperationBulk(conn, operation);
  }

  return executeApiOperationSoap(conn, operation);
}

module.exports = {
  executeApiOperationBulk,
  executeApiOperationSoap,
  executeApiOperation
};
