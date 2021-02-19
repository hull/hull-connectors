/**
 * Module dependencies.
 */
import _ from "lodash";
import Readable from "readable-stream";
import SequelizeUtils from "sequelize/lib/utils";
import { validateResultColumns } from "hull-sql-importer";

const tedious = require("tedious");

/**
 * MS SQL adapter.
 */

export function parseConnectionConfig(settings) {
  const conn = ["type", "host", "port", "name", "user", "password"].reduce(
    (c, key) => {
      const val = settings[`db_${key}`];
      // if (c && val && val.length > 0) {
      //   return { ...c, [key]: val };
      // }
      if (c && val) {
        if (key === "port") {
          let port = val;
          if (!_.isNumber(val)) {
            port = parseInt(val, 10);
          }
          return { ...c, [key]: port };
        } else if (val.length > 0) {
          return { ...c, [key]: val };
        }
      }
      // TODO Not sure what the intention was here, returning false will make this the next c, seems wrong
      // but maybe that was the intention if a value ever isn't something we expect?
      return false;
    },
    {}
  );
  // Must-have options
  let opts = {
    port: conn.port || 1433,
    database: conn.name,
    requestTimeout: 900000,
    encrypt: false
  };
  // All additional options are optional
  if (settings.db_options) {
    try {
      const customOptions = JSON.parse(settings.db_options);
      if (customOptions) {
        opts = {
          ...opts,
          ...customOptions
        };
      }
    } catch (parseError) {
      console.error("config.error", parseError);
    }
  }

  const config = {
    authentication: {
      type: "default",
      options: {
        userName: conn.user,
        password: conn.password
      }
    },
    server: conn.host,
    options: opts,
    debug: true
  };

  // console.log("Config: " + JSON.stringify(config, null, 2));

  return config;
}
/**
 * Open a new connection.
 *
 * @param {Object} settings The ship settings.
 *
 * @return {tedious.Connection} The tedious.Connection instance
 */
export function openConnection(settings) {
  const config = parseConnectionConfig(settings);
  const connection = new tedious.Connection(config);
  connection.on('connect', (err) => {
    console.log("MSSQL connected")
  });
  connection.on("debug", message => {
    console.log(`DEBUG: ${message}`);
  });
  connection.on("error", error => {
    console.log(`MSSQL Connection Error: ${JSON.stringify(error)}`);
  });
  connection.connect();
  return connection;
}

/**
 * Close the connection.
 *
 * @param {tedious.Connection} client The MSSQL client
 */
export function closeConnection(connection) {
  connection.close();
}

/**
 * Validate Result specific for mssql database
 * @returns Array of errors
 */

export function validateResult(result, import_type = "users") {
  return validateResultColumns(
    result.columns.map(column => column.colName),
    import_type
  );
}

/**
 *
 * @param error from database connector
 * @returns {{errors: Array}}
 */

export function checkForError(error) {
  if (error && error.code === "EREQUEST") {
    return { message: `Invalid Syntax: ${_.get(error, "message", "")}` };
  }

  if (error && error.code === "ESOCKET") {
    return { message: `Server Error: ${_.get(error, "message", "")}` };
  }

  return false;
}

/**
 * Wrap the user query inside a MS SQL request.
 *
 * @param {*} sql The raw SQL query
 * @param {*} replacements The replacement parameters
 */
export function wrapQuery(sql, replacements) {
  const replacementDates = _.reduce(
    replacements,
    (results, value, key) => {
      results[key] = new Date(value);
      return results;
    },
    {}
  );
  return SequelizeUtils.formatNamedParameters(sql, replacementDates, "mssql");
}

/**
 * Runs the query using the specified client and options.
 * @param {tedious.Connection} client The MS SQL client.
 * @param {string} query The query to execute.
 * @param {Object} options The options.
 *
 * @returns {Promise} A promise object of the following format: { rows }
 */
export function runQuery(client, query, options) {
  const limit = options.limit || 100;
  const opts = _.omit(options, "limit");

  return new Promise((resolve, reject) => {
    const confoptions = _.merge(client.config.options, opts);
    const conf = _.cloneDeep(client.config);
    conf.options = confoptions;

    let conn = client;

    conn.on("connect", err => {
      // eslint-disable-line consistent-return
      if (err) {
        if (err.message && err.message.includes("ECONNRESET")) {
          // This is an error caused by the Azure Load Balancer that is not really an error,
          // we can recover from it pretty easily by simply reconnecting.
          // See https://github.com/tediousjs/tedious/issues/300
          // try {
          //   conn.close();
          // } finally {
          //   // if the connection has been already closed, the call above will result in an error
          //   // but we can recover here:
          //   conn = new tedious.Connection(conf);
          // }

          // Commenting out the above code for now because it may cause potential crashes.
          // Logging it though because I'm not totally convinced it's even happening
          console.log(`Catchable ECONNRESET: ${err.message}`);
        }
        return reject(err);
      }

      const qparam = `WITH __qry__ AS (${query}) SELECT TOP(${limit}) * FROM __qry__`;

      const request = new tedious.Request(qparam, reqError => {
        // eslint-disable-line consistent-return

        if (reqError) {
          return reject(reqError);
        }
      });

      const rows = [];
      let columnNames = [];
      let resultReturned = false;
      let columnsReturned = false;

      request.on("row", columns => {
        const row = {};
        _.forEach(columns, column => {
          row[column.metadata.colName] = column.value;
        });
        rows.push(row);
      });

      request.on("done", rowCount => {
        // eslint-disable-line consistent-return
        if (_.isNumber(rowCount) && !resultReturned && columnsReturned) {
          resultReturned = true;
          return resolve({
            rows,
            columns: columnNames
          });
        }
      });

      request.on("doneInProc", rowCount => {
        // eslint-disable-line consistent-return
        if (_.isNumber(rowCount) && !resultReturned && columnsReturned) {
          resultReturned = true;
          return resolve({
            rows,
            columns: columnNames
          });
        }
      });

      request.on("doneProc", rowCount => {
        // eslint-disable-line consistent-return
        if (_.isNumber(rowCount) && !resultReturned && columnsReturned) {
          resultReturned = true;
          return resolve({
            rows,
            columns: columnNames
          });
        }
      });

      request.on("columnMetadata", columns => {
        columnNames = columns;
        columnsReturned = true;
      });

      conn.execSql(request);
    });
  });
}

/**
 * Creates a readable stream that contains the query result.
 * @param {tedious.Connection} client The MS SQL client.
 * @param {string} query The query to execute.
 * @param {Object} options The options.
 *
 * @returns {Promise} A promise object that wraps a stream.
 */
export function streamQuery(client, query, options = {}) {
  return new Promise(resolve => {
    const conn = client;

    const streamOpts = {};
    streamOpts.objectMode = true;
    streamOpts.highWaterMark = 10;
    const stream = new Readable(streamOpts);

    let resultReturned = false;

    // let limit = 1;

    const request = new tedious.Request(query, reqError => {
      // eslint-disable-line consistent-return

      if (reqError) {
        stream.emit("error", reqError);
      }
    });

    request.on("row", columns => {
      const row = {};
      _.forEach(columns, column => {
        row[column.metadata.colName] = column.value;
      });

      // if upstream returns false (backpressure) we want to pause the stream
      if (!stream.push(row)) {
        // below was my way of testing to make sure the row that we paused on was still delivered
        // limit += 1;
        // row.rowNumber = limit;
        // console.log(`[${limit}]Paused on: ${JSON.stringify(row)}`);

        // pause the stream, the resume() method in the _read should resume the stream when upstream is ready
        request.pause();
      }
    });

    request.on("done", rowCount => {
      // eslint-disable-line consistent-return
      if (_.isNumber(rowCount) && !resultReturned) {
        resultReturned = true;
        stream.push(null);
      }
    });

    request.on("doneInProc", rowCount => {
      // eslint-disable-line consistent-return
      if (_.isNumber(rowCount) && !resultReturned) {
        resultReturned = true;
        stream.push(null);
      }
    });

    request.on("doneProc", rowCount => {
      // eslint-disable-line consistent-return
      if (_.isNumber(rowCount) && !resultReturned) {
        resultReturned = true;
        stream.push(null);
      }
    });

    conn.on("connect", err => {
      // eslint-disable-line consistent-return
      if (err) {
        stream.emit("error", err);
        // don't need to execute request if had an error
        console.log(
          `MSSQL: Would have executed request: ${JSON.stringify(err)}`
        );
        return;
      }

      conn.execSql(request);
    });

    stream._read = function() {
      // eslint-disable-line func-names
      // call resume to ensure the stream is flowing if upstream is trying to read
      // within this call checks to see if the stream is paused and if it isn't, then just returns
      request.resume();
    };

    stream.once("end", () => {
      process.nextTick(() => {
        stream.emit("close");
      });
    });
    return resolve(stream);
  });
}
