/**
 * Module dependencies.
 */
import Pg from "pg";
import QueryStream from "pg-query-stream";
import Promise from "bluebird";
import SequelizeUtils from "sequelize/lib/utils";
import _ from "lodash";
import parseConnectionConfig from "../utils/parse-connection-config";
import validateResultColumns from "./validate-result-columns";

/**
 * PostgreSQL adapter.
 */

function parseIncomingFloat(val) {
  return parseFloat(val);
}
function parseIncomingInt(val) {
  return parseInt(val, 10);
}

/**
 * Got these types from searching the pg_type database.  Not sure if these are per instance config or are global...
 * https://github.com/brianc/node-pg-types
*/
  // select typname, typrelid, typelem, typarray from pg_type where typname like '%numeric'
Pg.types.setTypeParser(1700, parseIncomingFloat);
Pg.types.setTypeParser(1231, parseIncomingFloat);
// select typname, typrelid, typelem, typarray from pg_type where typname like '%int8';
Pg.types.setTypeParser(20, parseIncomingInt);
Pg.types.setTypeParser(1016, parseIncomingInt);

/**
 * Open a new connection.
 *
 * @param {Object} settings The ship settings.
 *
 * @return {Pg.Client} A postgre client instance
 */
export function openConnection(settings) {
  const connection_string = parseConnectionConfig(settings);
  return new Pg.Client(connection_string);
}

/**
 * Close the connection.
 *
 * @param {Pg.Client} client The postgre client
 */
export function closeConnection(client) {
  client.end();
}

/**
 * Validate Result specific for postgres database
 * @param result
 * @returns Array of errors
 */

export function validateResult(result, import_type = "users") {
  return validateResultColumns(result.fields.map(column => column.name), import_type);
}

/**
 *
 * @param error from database connector
 * @returns {{errors: Array}}
 */

export function checkForError(error) {
  if (error && error.routine === "scanner_yyerror") {
    return { message: `Invalid Syntax: ${_.get(error, "message", "")}` };
  }

  if (error && (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED")) {
    return { message: `Server Error: ${_.get(error, "message", "")}` };
  }

  return false;
}

/**
 * Wrap the user query inside a PostgreSQL request.
 *
 * @param {*} sql The raw SQL query
 * @param {*} replacements The replacement parameters
 */
export function wrapQuery(sql, replacements) {
  const query = SequelizeUtils.formatNamedParameters(sql, replacements, "postgres");
  return `WITH __qry__ AS (${query}) SELECT * FROM __qry__`;
}

/**
 * Cancels a query that is excecuted by the specified client.
 *
 * @param {Pg.Client} client The postgre client who runs the query.
 *
 * @return {*} A new postgre client or false if an error occurred.
 */
function cancelQuery(client) {
  const { processID } = client;
  const c2 = new Pg.Client(client.connectionParameters);
  c2.connect((cErr) => {
    if (cErr) return false;
    c2.query(`SELECT pg_cancel_backend(${processID})`, () => {
      c2.end();
    });
    return c2;
  });
}

/**
 * Runs the query using the specified client and options.
 * @param {Pg.Client} client The PostgreSQL client.
 * @param {string} query The query to execute.
 * @param {Object} options The options.
 *
 * @returns {Promise} A promise object of the following format: { rows, fields }
 */
export function runQuery(client, query, options = {}) {
  return new Promise((resolve, reject) => {
    // Limit the result.
    query = `${query} LIMIT ${options.limit || 100}`;

    let timer;
    let currentQuery;

    if (options.timeout) {
      timer = setTimeout(() => {
        reject(new Error("Timeout error"));
        cancelQuery(client);
      }, options.timeout);
    }

    // Connect the connection.
    client.connect((connectionError) => {
      if (connectionError) {
        // Ensure that we release the connection under
        // all circumstances
        client.end();
        connectionError.status = 401;
        return reject(connectionError);
      }

      // Run the query.
      currentQuery = client.query(query, (queryError, result) => {
        if (timer) clearTimeout(timer);
        if (queryError) {
          queryError.status = 400;
          return reject(queryError);
        }
        return resolve(result);
      });

      return currentQuery;
    });
  });
}

/**
 * Creates a readable stream that contains the query result.
 * @param {Pg.Client} client The PostgreSQL client.
 * @param {string} query The query to execute.
 * @param {Object} options The options.
 *
 * @returns {Promise} A promise object that wraps a stream.
 */
export function streamQuery(client, query) {
  return new Promise((resolve, reject) => {
    // After connecting the connection, stream the query.
    client.connect((connectionError) => {
      if (connectionError) {
        return reject(connectionError);
      }
      const stream = client.query(new QueryStream(query));
      // Ensure that we release the connection under all circumstances.
      stream.on("end", () => { client.end(); });
      resolve(stream);
      return stream;
    });
  });
}

