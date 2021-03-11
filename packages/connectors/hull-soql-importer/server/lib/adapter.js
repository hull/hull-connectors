/**
 * Module dependencies.
 */
import jsforce from "jsforce";
import csv from "csv-stream";
import Promise from "bluebird";
import _ from "lodash";
import { validateResultColumns } from "hull-sql-importer";
import { SoqlQuery } from "./soql-query";

/**
 * Salesforce adapter.
 */

/**
 * Open a new connection.
 *
 * @param {Object} settings The ship settings.
 *
 */
export function openConnection(settings) {
  const params = {
    oauth2: {
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET
    },
    instanceUrl: settings.instance_url,
    accessToken: settings.access_token,
    refreshToken: settings.refresh_token
  };

  return new jsforce.Connection(params);
}

export function getRequiredParameters() {
  return ["access_token", "refresh_token", "instance_url"];
}

export function areConnectionParametersConfigured(settings) {
  return _.every(getRequiredParameters(), requiredField => {
    return !_.isNil(settings[requiredField]);
  });
}

// TODO
// eslint-disable-next-line no-unused-vars
export function isValidConfiguration(settings) {
  return true;
}

/**
 * Close the connection.
 */
// eslint-disable-next-line no-unused-vars
export function closeConnection(client) {
  return Promise.resolve();
}

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

// TODO
// eslint-disable-next-line no-unused-vars
export function checkForError(error) {
  return false;
}

/**
 * Wrap the user query inside a SQL query.
 *
 * @param {*} sql The raw SQL query
 * @param {*} replacements The replacement parameters
 */
export function wrapQuery(sql, replacements) {
  const query = new SoqlQuery(sql);
  const executableQuery = query.getExecutableQuery();
  return query.replaceNamedParameters(executableQuery, replacements);
}

export function getAttributeMapping(sql) {
  const query = new SoqlQuery(sql);
  return query.getAttributeMappings();
}

/**
 * Runs the query using the specified client and options.
 * @param client The Salesforce client.
 * @param {string} query The query to execute.
 * @param {Object} options The options.
 *
 * @returns {Promise} A promise object of the following format: { rows }
 */
export function runQuery(client, query, options = {}) {
  return new Promise((resolve, reject) => {
    const soqlText = `${query} LIMIT ${options.limit || 100}`;
    client.query(soqlText, (err, result) => {
      if (err) return reject(err);
      return resolve({ rows: result.records });
    });
  });
}

/**
 * Creates a readable stream that contains the query result.
 * @param client The Salesforce client.
 * @param {string} query The query to execute.
 * @param {Object} options The options.
 *
 * @returns {Promise} A promise object that wraps a stream.
 */
export function streamQuery(client, query) {
  const options = {
    escapeChar: '"',
    enclosedChar: '"'
  };

  const csvStream = csv.createStream(options);

  // eslint-disable-next-line no-unused-vars
  return new Promise((resolve, reject) => {
    const stream = client.bulk.query(query).stream().pipe(csvStream);

    return resolve(stream);
  });
}

export function transformRecord({ record, mapping }) {
  return _.reduce(
    record,
    (transformedRecord, attributeValue, attributeKey) => {
      const attributeName = attributeKey.toLowerCase().replace(/\./g, "_");
      const attributeMapping = _.find(mapping, entry => {
        return entry.service === attributeName;
      });

      if (attributeMapping) {
        transformedRecord[attributeMapping.hull] = attributeValue;
      } else {
        transformedRecord[attributeName] = attributeValue;
      }
      return transformedRecord;
    },
    {}
  );
}
