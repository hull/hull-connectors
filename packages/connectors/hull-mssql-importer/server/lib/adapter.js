/**
 * Module dependencies.
 */

// eslint-disable-next-line no-unused-vars
import SequelizeUtils from "sequelize/lib/utils";
// eslint-disable-next-line no-unused-vars
import _ from "lodash";
// eslint-disable-next-line no-unused-vars
import { validateResultColumns } from "hull-sql";

/**
 * SnowFlake adapter.
 */

/**
 * Open a new connection.
 *
 * @param {Object} settings The ship settings.
 *
 */
export function openConnection(_settings) {}

export function getRequiredParameters() {}

export function isValidConfiguration(_settings) {}

/**
 * Close the connection.
 */
export function closeConnection(_client) {}

/**
 * Validate Result specific for database
 * @returns Array of errors
 */

export function validateResult(_result, _import_type = "users") {}

/**
 *
 * @param error from database connector
 * @returns {{errors: Array}}
 */

export function checkForError(_error) {}

/**
 * Wrap the user query inside a SQL query.
 *
 * @param {*} sql The raw SQL query
 * @param {*} replacements The replacement parameters
 */
export function wrapQuery(_sql, _replacements) {}

/**
 * Runs the query using the specified client and options.
 * @param client The SnowFlake client.
 * @param {string} query The query to execute.
 * @param {Object} options The options.
 *
 * @returns {Promise} A promise object of the following format: { rows }
 */
export function runQuery(client, query, _options = {}) {}

/**
 * Creates a readable stream that contains the query result.
 * @param client The SnowFlake client.
 * @param {string} query The query to execute.
 * @param {Object} options The options.
 *
 * @returns {Promise} A promise object that wraps a stream.
 */
export function streamQuery(_client, _query) {}

export function transformRecord(_record) {}
