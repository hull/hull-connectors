/**
 * Module dependencies.
 */
const { BigQuery } = require("@google-cloud/bigquery");
import Promise from "bluebird";
import SequelizeUtils from "sequelize/lib/utils";
import _ from "lodash";
import { validateResultColumns } from "hull-sql";

/**
 * Bigquery adapter.
 */

/**
 * Open a new connection.
 *
 * @param {Object} settings The ship settings.
 *
 */
export function openConnection(settings) {
  try {
    const options = {
      credentials: JSON.parse(settings.service_account_key),
      projectId: settings.project_id
    };

    if (_.isEmpty(options.credentials) || _.isEmpty(options.projectId)) {
      return null;
    }

    return new BigQuery(options);
  } catch (err) {
    return null;
  }
}

export function getRequiredParameters() {
  return [];
}

export function isValidConfiguration(settings) {
  const key = settings.service_account_key;
  const project = settings.project_id;

  if (_.isEmpty(key) || _.isEmpty(project)) {
    return false;
  }
  return true;
}

/**
 * Close the connection.
 */
export function closeConnection(client) {}

/**
 * Validate Result specific for database
 * @returns Array of errors
 */

export function validateResult(result, import_type = "users") {
  if (!result.rows || result.rows.length === 0) {
    return "Try to select a preview query which will return some results to validate";
  }
  return validateResultColumns(Object.keys(result.rows[0]), import_type);
}

/**
 *
 * @param error from database connector
 * @returns {{errors: Array}}
 */

export function checkForError(_error) {
  // default behavior is to check for a "message" and bubble it up which is correct
  return false;
}

/**
 * Wrap the user query inside a SQL query.
 *
 * @param {*} sql The raw SQL query
 * @param {*} replacements The replacement parameters
 */
export function wrapQuery(sql, replacements) {
  return SequelizeUtils.formatNamedParameters(sql, replacements, "mysql");
}

/**
 * Runs the query using the specified client and options.
 * @param client The Bigquery client.
 * @param {string} query The query to execute.
 * @param {Object} options The options.
 *
 * @returns {Promise} A promise object of the following format: { rows }
 */
export function runQuery(client, query, options = {}) {
  return new Promise((resolve, reject) => {
    // For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
    const options = {
      query: query
    };

    return client.query(query).then(data => resolve({ rows: data[0] }));

    // client.connect(connectionError => {
    //   if (connectionError) {
    //     connectionError.status = 401;
    //     return reject(connectionError);
    //   }
    //   const sqlText = `${query} LIMIT ${options.limit || 100}`;
    //
    //   return client.execute({
    //     sqlText,
    //     complete: (queryError, stmt, rows) => {
    //       if (queryError) {
    //         queryError.status = 400;
    //         return reject(queryError);
    //       }
    //       return resolve({ rows });
    //     }
    //   });
    // });
  });
}

/**
 * Creates a readable stream that contains the query result.
 * @param client The Bigquery client.
 * @param {string} query The query to execute.
 * @param {Object} options The options.
 *
 * @returns {Promise} A promise object that wraps a stream.
 */
export function streamQuery(client, query) {
  return new Promise((resolve, reject) => {
    return client
      .createQueryStream(query)
      .on("data", row => {
        resolve(row);
      })
      .on("end", () => {})
      .on("error", error => {
        reject(error);
      });
  });
}

export function transformRecord(record) {
  const transformedRecord = {};
  _.forEach(record, (value, key) => {
    transformedRecord[_.toLower(key)] = record[key];
  });
  return transformedRecord;
}
