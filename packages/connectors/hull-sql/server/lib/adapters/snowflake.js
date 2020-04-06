/**
 * Module dependencies.
 */
import snowflake from "snowflake-sdk";
import Promise from "bluebird";
import SequelizeUtils from "sequelize/lib/utils";
import validateResultColumns from "./validate-result-columns";
import _ from "lodash";

/**
 * SnowFlake adapter.
 */

/**
 * Open a new connection.
 *
 * @param {Object} settings The ship settings.
 *
 */
export function openConnection(settings) {
  // Must specify region even though it's supposed to be deprecated
  // Known issue with nodejs sdk (today is Jan 15 2019)
  // https://stackoverflow.com/questions/54129786/snowflake-dw-conncetion-with-node-js-driver
  const conf = {
    account: settings.db_account,
    region: settings.db_region,
    username: settings.db_user,
    password: settings.db_password,
    database: settings.db_name
  };

  // Cannot create connection if these things are blank
  // snowflake actually does validation with this, the problem is that we
  // call openConnection from the constructor... before we validate the input
  // so there are cases where it blows up early... not what a constructor should be doing
  if (
    _.isEmpty(conf.account)
    || _.isEmpty(conf.region)
    || _.isEmpty(conf.username)
    || _.isEmpty(conf.password)
    || _.isEmpty(conf.database)
  ) {
    return null;
  }
  return snowflake.createConnection(conf);
}

export function getRequiredParameters() {
  return ["account", "region", "name", "user", "password"];
}

export function isValidConfiguration(settings) {
  const val = settings.db_account;
  if (val && typeof val === "string" && val.length > 0) {
    // Need to validate that all account names consist of only letters/digits
    // js1234.us-east-1 is how some people enter the account name
    // and it really blows stuff up on the connector:
    // TypeError: Cannot read property 'getPeerCertificate' of null
    const accountNameRegEx = /^\w+$/g;
    const result = val.match(accountNameRegEx);
    if (
      !Array.isArray(result) ||
      result.length !== 1 ||
      result[0].length !== val.length
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Close the connection.
 */
export function closeConnection(client) {
  if (!client.isUp()) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => client.destroy((err, conn) => {
    return err ? reject(err) : resolve(conn);
  }));
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

export function checkForError(error) {
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
 * @param client The SnowFlake client.
 * @param {string} query The query to execute.
 * @param {Object} options The options.
 *
 * @returns {Promise} A promise object of the following format: { rows }
 */
export function runQuery(client, query, options = {}) {
  return new Promise((resolve, reject) => {
    // Connect the connection.
    client.connect((connectionError) => {
      if (connectionError) {
        connectionError.status = 401;
        return reject(connectionError);
      }
      const sqlText = `${query} LIMIT ${options.limit || 100}`;

      return client.execute({
        sqlText,
        complete: (queryError, stmt, rows) => {
          if (queryError) {
            queryError.status = 400;
            return reject(queryError);
          }
          return resolve({ rows });
        } });
    });
  });
}

/**
 * Creates a readable stream that contains the query result.
 * @param client The SnowFlake client.
 * @param {string} query The query to execute.
 * @param {Object} options The options.
 *
 * @returns {Promise} A promise object that wraps a stream.
 */
export function streamQuery(client, query) {
  return new Promise((resolve, reject) => {
    // Connect the connection.
    client.connect((connectionError) => {
      if (connectionError) {
        connectionError.status = 401;
        return reject(connectionError);
      }

      return client.execute({
        sqlText: query,
        streamResult: true,
        complete: (queryError, stmt) => {
          if (queryError) {
            queryError.status = 400;
            return reject(queryError);
          }
          return resolve(stmt.streamRows());
        } });
    });
  });
}
