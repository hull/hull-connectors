/**
 * Module dependencies.
 */
const { BigQuery, BigQueryDatetime } = require("@google-cloud/bigquery");
const { UserRefreshClient } = require('google-auth-library');
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
  const {
    refresh_token,
    service_account_key,
    project_id
  } = settings;

  if (_.isEmpty(project_id)) {
    return null;
  }

  try {
    if (!_.isEmpty(service_account_key)) {
      const options = {
        projectId: project_id,
        credentials: JSON.parse(service_account_key)
      };
      if (_.isEmpty(options.credentials)) {
        return null;
      }
      return new BigQuery(options);
    } else {
      const credentials = {
        type: 'authorized_user',
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        refresh_token
      };
      if (_.isEmpty(credentials.refresh_token)) {
        return null;
      }
      const refreshClient = new UserRefreshClient();
      refreshClient.fromJSON(credentials);

      const bigquery = new BigQuery({ projectId: project_id });
      bigquery.authClient.cachedCredential = refreshClient;

      return bigquery;
    }
  } catch (err) {
    return null;
  }
}

export function getRequiredParameters() {
  return [];
}

export function isValidConfiguration(settings) {
  const {
    refresh_token,
    service_account_key,
    project_id
  } = settings;

  const badKeyConf = _.isEmpty(service_account_key) || _.isEmpty(project_id);
  const badTokenConf = _.isEmpty(refresh_token) || _.isEmpty(project_id);
  if (badKeyConf && badTokenConf) {
    return false;
  }

  // Check if we have a parsable json string
  if (!badKeyConf) {
    try {
      JSON.parse(service_account_key);
    } catch (err) {
      return false;
    }
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
      query: `${query} LIMIT 100`
    };

    return client.query(options)
      .then(data => resolve({ rows: data[0] }))
      .catch(err => {
        return reject(err);
      });
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
  return Promise.resolve(client.createQueryStream(query));
}

/**
 * Transform each row with the right format
 * For this specific connector, prefix all attributes with a value from settings
 * @param record the current row to edit
 * @param settings private_settings containing the prefix
 * @returns transformRecord containing the newly formatted attributes
 */
export function transformRecord(record, settings) {
  const transformedRecord = {};
  const skipFields = ["email", "external_id", "domain"];
  const prefix = _.get(settings, "attributes_group_name", "bigquery");
  _.forEach(record, (value, key) => {
    let transformedKey;
    let transformedValue = typeof record[key] === BigQueryDatetime ? record[key].value : record[key];
    if (settings.import_type === "events" || skipFields.indexOf(_.toLower(key)) > -1) {
      transformedKey = _.toLower(key);
    } else {
      transformedKey = `${prefix}/${_.toLower(key)}`;
    }
    transformedRecord[transformedKey] = transformedValue;
  });
  return transformedRecord;
}
