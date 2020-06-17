/* @flow */
import type { TResourceType } from "../types";

const Promise = require("bluebird");

const Connection = require("./connection");

/**
 * Executes a search against the Salesforce API using
 * the provided connection.
 *
 * @export
 * @param {Connection} conn The connection to use for communication with Salesforce.
 * @param {TResourceType} resource The type or resource to query.
 * @param {*} query The query object using MongoDB like syntax.
 * @param {Object} fields The list of fields to retrieve.
 * @param {number} [limit=10000] The maximum number of records to fetch, defaults to 10000.
 * @param {number} [skip=0] The number of records to skip.
 * @returns {Promise<any[]>} The list of records matching the query.
 */
function find(conn: Connection, resource: TResourceType, query: any, fields: Object, limit: number = 10000, skip: number = 0): Promise<any[]> {
  return new Promise((resolve, reject) => {
    conn.sobject(resource)
      .find(query, fields)
      // To make sure we are working always on the array with the same order
      // we request the API to get oldest record as first on the array
      .sort({ CreatedDate: 1 })
      .limit(limit)
      .skip(skip)
      .execute({ autoFetch: true }, (err, records) => {
        if (err) {
          return reject(err);
        }
        return resolve(records);
      });
  });
}

module.exports = { find };
