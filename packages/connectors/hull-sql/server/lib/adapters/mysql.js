/**
 * Module dependencies.
 */
import mysql from "hull-mariadb";
import Promise from "bluebird";
import SequelizeUtils from "sequelize/lib/utils";
import _ from "lodash";
import parseConnectionConfig from "../utils/parse-connection-config";
import validateResultColumns from "./validate-result-columns";

/**
 * mySQL adapter.
 */

/**
 * Open a new connection.
 *
 * @param {Object} settings The ship settings.
 *
 * @return {mysql.IConnection} A mysql connection instance
 */

const CONNECTIONS = {};


function traceConnections() {
  console.warn("-------------- START: connections list --------------")
  _.map(CONNECTIONS, (c, cid) => {
    console.warn(cid, c.id, c.status, (c.connection && c.connection.isValid()));
  });
  console.warn("--------------- END: connections list ---------------")
}

// setInterval(traceConnections, 5000)

class MysqlConnection {

  constructor(settings) {
    this.id = _.uniqueId('mysql-connection-');
    // TODO: refactor this to allow a list of known valid options
    this.connection_options = {
      host: settings.db_host,
      user: settings.db_user,
      password: settings.db_password,
      database: settings.db_name,
      port: settings.db_port
    };

    if (settings.db_options && settings.db_options.length && settings.db_options.split) {
      settings.db_options.split("&").map((o) => {
        const [k,v] = o.split("=");
        if (k === "ssl" && v === "true") {
          this.connection_options.ssl = true;
        }
      });
    }

    this.status = "pending";
  }

  connect() {
    if (this.connecting) return this.connecting;
    this.connecting = mysql.createConnection(this.connection_options);
    this.connecting.then(
      conn => {
        CONNECTIONS[this.id] = this;
        this.status = 'connected';
        this.connection = conn
      },
      err => {
        this.status = 'error';
        this.connectionError = err;
      }
    )
    return this.connecting;
  }

  isConnected() {
    if (this.connecting && !this.connection) {
      return this.connecting.then(
        conn => conn.isValid(),
        err => false
      )
    }
    return Promise.resolve(this.connection && this.connection.isValid());
  }

  closeConnection() {
    return this.isConnected().then(
      connected => {
        this.status = 'closing';
        if (connected) {
          return this.connection.end().then(
            ok => this.status = 'closed',
            err => {
              this.status = 'error'
              this.connectionError = err
            }
          )
        }
      }
    )
  }
}

function openConnection(settings) {
  return new MysqlConnection(settings);
}

/**
 * Close the connection.
 *
 * @param {mysql.IConnection} client The mysql client
 */
function closeConnection(client) {
  return client.closeConnection();
}

/**
 * Validate Result specific for mysql database
 * @returns Array of errors
 */

function validateResult(result, import_type = "users") {
  return validateResultColumns(result.columns.map(column => column.name), import_type);
}

/**
 *
 * @param error from database connector
 * @returns {{errors: Array}}
 */

function checkForError(error) {
  if (error && error.code === "ER_PARSE_ERROR") {
    return { message: `Invalid Syntax: ${_.get(error, "sqlMessage", "")}` };
  }

  if (error && (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND")) {
    return { message: `Server Error: ${_.get(error, "message", "")}` };
  }
  return false;
}

/**
 * Wrap the user query inside a My SQL request.
 *
 * @param {*} sql The raw SQL query
 * @param {*} replacements The replacement parameters
 */
function wrapQuery(sql, replacements) {
  return SequelizeUtils.formatNamedParameters(sql, replacements, "mysql");
}

/**
 * Runs the query using the specified client and options.
 * @param {mysql.IConnection} client The My SQL client.
 * @param {string} query The query to execute.
 * @param {Object} options The options.
 *
 * @returns {Promise} A promise object of the following format: { rows }
 */
function runQuery(client, query, options = {}) {
  return new Promise((resolve, reject) => {
    client.connect().then(conn => {
      let timer;

      if (options.timeout) {
        timer = setTimeout(() => {
          reject(new Error("Timeout error"));
        }, options.timeout);
      }

      const params = { sql: `${query} LIMIT ${options.limit || 100}` };
      return conn.query(params).then((rows) => {
        if (timer) clearTimeout(timer);
        const columnNames = Object.keys(rows[0]);
        const columnTypes = _.map(rows.meta, 'type');
        const columns = _.zip(columnNames, columnTypes).map(([ name, type ]) => ({ name, type }));
        resolve({ rows, columns });
      }, reject);
    }, reject);
  });
}

/**
 * Creates a readable stream that contains the query result.
 * @param {mysql.IConnection} client The My SQL client.
 * @param {string} query The query to execute.
 * @param {Object} options The options.
 *
 * @returns {Promise} A promise object that wraps a stream.
 */
function streamQuery(client, query, options = {}) {
  return new Promise((resolve, reject) => {
    return client.connect().then((conn) => {
      const stream = conn.queryStream(query);
      stream.on("fields", (fields) => {
        resolve(stream);
      });
      stream.on("end", () => {
        client.closeConnection();
      });
      stream.on("error", (err) => {
        client.closeConnection();
        reject(err);
      });
    }, reject);
  });
}


module.exports = {
  openConnection,
  closeConnection,
  runQuery,
  validateResult,
  checkForError,
  wrapQuery,
  streamQuery
}
