/**
 * Module dependencies.
 */
import moment from "moment";
import ps from "promise-streams";

import { v1 as uuid } from "uuid";

// Map each record of the stream.
import map from "through2-map";
import through2 from "through2";

import * as Adapters from "./adapters";

const _ = require("lodash");

const {
  SSHConnection
} = require("hull-connector-framework/src/purplefusion/ssh/ssh-connection");
const {
  getSshTunnelConfig,
  getDatabaseConfig
} = require("hull-connector-framework/src/purplefusion/ssh/ssh-utils");

const DEFAULT_BATCH_SIZE = parseInt(process.env.BATCH_SIZE || "5000000", 10);
const FULL_IMPORT_DAYS = process.env.FULL_IMPORT_DAYS || "10000";

/**
 * Export the sync agent for the SQL ship.
 */

class ConfigurationError extends Error {
  constructor(msg) {
    super(msg);
    this.status = 403;
  }
}

let rotatingForwardingPort = 0;

export default class SyncAgent {
  /**
   * Creates a new SyncAgent instance.
   * @param {*} param0 The configuration for the client.
   * @param adapter
   */
  constructor(
    { helpers, connector, client, job, metric, batchSize = DEFAULT_BATCH_SIZE },
    adapter
  ) {
    // Expose the ship settings
    // and the Hull instance.
    this.ship = connector;
    this.hull = client;
    this.job = job;
    this.metric = metric;
    this.batchSize = batchSize;

    this.importDelay = _.random(
      0,
      _.get(this.ship.private_settings, "sync_interval", 120)
    );

    this.ipCheck = helpers.ipCheck;
    const private_settings = this.ship.private_settings;
    this.import_type = private_settings.import_type || "users";

    const { db_type, output_type = "s3" } = private_settings;

    // adapter[db_type] for legacy implementation
    this.adapter = {
      in: !_.isNil(db_type) && adapter[db_type]  ? adapter[db_type] : adapter,
      out: Adapters[output_type]
    };

    // Make sure the DB type is known.
    // If not, throw an error.
    // Otherwise, use the correct adapter.
    if (!this.adapter.in) {
      throw new ConfigurationError(`Invalid database type.`);
    }
    if (!this.adapter.out) {
      throw new ConfigurationError(`Invalid output type ${output_type}.`);
    }

    // try {
    //   this.client = this.adapter.in.openConnection(private_settings);
    // } catch (err) {
    //   let message;
    //   const error = this.adapter.in.checkForError(err);
    //   if (error) {
    //     message = error.message;
    //   } else {
    //     message = `Server Error: ${_.get(err, "message", "")}`;
    //   }
    //
    //   client.logger.error("connection.error", { hull_summary: message });
    //   throw err;
    // }
    return this;
  }

  async createClient() {
    const { db_host, ssh_host } = this.ship.private_settings
    if (this.requiresSshTunnel()) {
      await this.ipCheck(ssh_host);
      return this.openClientWithTunnel();
    }
    await this.ipCheck(db_host);
    return this.openClient();
  }

  openClient() {
    try {
      const private_settings = this.ship.private_settings;
      return Promise.resolve(this.adapter.in.openConnection(private_settings));
    } catch (err) {
      let message;
      const error = this.adapter.in.checkForError(err);
      if (error) {
        message = error.message;
      } else {
        message = `Server Error: ${_.get(err, "message", "")}`;
      }

      this.hull.logger.error("connection.error", { hull_summary: message });
      return Promise.reject(err);
    }
  }

  requiresSshTunnel() {
    return !_.isEmpty(_.get(this.ship, "private_settings.ssh_host"));
  }

  openClientWithTunnel() {
    const private_settings = this.ship.private_settings;

    const dbConfig = getDatabaseConfig(private_settings);
    const sshConfig = getSshTunnelConfig(private_settings);

    this.sshConnection = new SSHConnection({
      endPort: sshConfig.port,
      endHost: sshConfig.host,
      username: sshConfig.user,
      privateKey: sshConfig.privateKey
    });

    // Rotate ports just in case we're proxying multiple queries at the same time
    // betweek 50k and 60k port number
    // rotating every 10k
    rotatingForwardingPort += 1;
    const portIncrement = rotatingForwardingPort % 10000;
    const portForward = 50000 + portIncrement;

    return this.sshConnection
      .forward({
        fromPort: portForward,
        toPort: dbConfig.port,
        toHost: dbConfig.host
      })
      .then(() => {
        return Promise.resolve(
          this.adapter.in.openConnection({
            db_host: "127.0.0.1",
            db_port: portForward,
            db_user: dbConfig.user,
            db_password: dbConfig.password,
            db_name: dbConfig.database
          })
        );
      });

    // return new Promise((resolve, reject) => {
    //
    //   rotatingForwardingPort += 1;
    //   const portIncrement = rotatingForwardingPort % 10000;
    //   const portForward = 50000 + portIncrement;
    //
    //   const config = {
    //     username: sshConfig.user,
    //     // Password:'secret',
    //     privateKey: sshConfig.privateKey,
    //     host: sshConfig.host,
    //     port: 22,
    //     dstHost: dbConfig.host,
    //     dstPort: dbConfig.port,
    //     localHost: "127.0.0.1",
    //     localPort: portForward
    //   };
    //
    //
    //   const tunnel = sshTunnel(config, (error, tnl) => {
    //     if (error) {
    //       return reject(error);
    //     }
    //     return resolve(this.adapter.in.openConnection({
    //       db_host: "127.0.0.1",
    //       db_port: portForward,
    //       db_user: dbConfig.user,
    //       db_password: dbConfig.password,
    //       db_name: dbConfig.database
    //     }));
    //   });
    //
    //   tunnel.on("error", (err) => {
    //     console.error(`SSH Tunnel error for ${sshConfig.host}`, err);
    //     reject(err);
    //   });
    //
    // });
  }

  closeClient(client) {
    try {
      if (client !== undefined && client !== null) {
        this.adapter.in.closeConnection(client);
      }
      // may want to handle a return of the promise on close in the future...
      if (this.sshConnection !== undefined && this.sshConnection !== null) {
        this.sshConnection.shutdown();
      }
    } catch (closeClientError) {
      const closeClientErrorMessage = _.get(
        closeClientError,
        "message",
        "Unknown Error Closing Client"
      );
      this.hull.logger.error("incoming.job.error", {
        jobName: "sync",
        hull_summary: closeClientErrorMessage
      });
    }
  }

  handleAndReturnAppropriateError(error) {
    let appropriateError = error;

    let { message } = this.adapter.in.checkForError(error);
    if (!message) {
      message = _.get(error, "message");
      if (this.requiresSshTunnel()) {
        if (error.code === "ER_SOCKET_UNEXPECTED_CLOSE") {
          message =
            "There was an unexpected issue connecting to the database through the bastion, please double check your connector settings to ensure they are correct, if you think they are, please contact a Hull representative for assistance";
        } else if (
          error.message === "All configured authentication methods failed"
        ) {
          message =
            "Connecting to the bastion server through ssh failed, please double check your ssh settings to ensure they are correct, if you think they are, please contact a Hull representative for assistance";
        }
      }
    }

    // preserving original behavior which did this:
    // message =  _.get(error, "message", error);
    if (!message) {
      message = error;
    } else {
      appropriateError = new Error(message);
    }

    this.hull.logger.error("incoming.job.error", {
      jobName: "sync",
      hull_summary: message
    });
    return appropriateError;
  }

  /**
   * Returns whether sync is enabled or not.
   * @return {boolean} True if sync is enabled; otherwise false.
   */
  isEnabled() {
    return this.ship.private_settings.enabled === true;
  }

  /**
   * Returns whether all required connection parameters have been supplied.
   * @return {boolean} True if all parameters are specified; otherwise false.
   */
  areConnectionParametersConfigured() {
    const settings = this.ship.private_settings;

    let validationParameters = [
      "type",
      "host",
      "port",
      "name",
      "user",
      "password"
    ];

    if (this.adapter.in.getRequiredParameters) {
      validationParameters = this.adapter.in.getRequiredParameters();
    }

    const conn = validationParameters.reduce((c, key) => {
      let val = settings[`db_${key}`];
      if (key === "type" && val === "redshift") val = "postgres";
      if (c && val && (val.length > 0 || (key === "port" && _.isNumber(val)))) {
        return { ...c, [key]: val };
      }
      // TODO Not sure what the intention was here, returning false will make this the next c, seems wrong
      // but maybe that was the intention if a value ever isn't something we expect?
      return false;
    }, {});

    const hasRequiredFields = !!conn;

    if (hasRequiredFields) {
      if (this.adapter.in.isValidConfiguration) {
        if (!this.adapter.in.isValidConfiguration(settings)) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  /**
   * Returns whether the query string has been configured.
   * @return {boolean} True if the query string is set; otherwise false.
   */
  isQueryStringConfigured() {
    return !!this.getQuery();
  }

  /**
   * Returns the SQL query from the ship settings.
   * @return {string} The SQL query string as supplied by the user.
   */
  getQuery(pendingQuery) {
    const query = _.isEmpty(pendingQuery)
      ? this.ship.private_settings.query
      : pendingQuery;
    return _.trimEnd(query, ";");
  }

  /**
   * Run a wrapped query.
   *
   * Params:
   *   @query String*
   *   @callback Function*
   *
   * Return:
   *   @callback Function
   *     - @error Object
   *     - @success Object
   */

  runQuery(query, options = {}) {
    // Wrap the query.
    const oneDayAgo = moment()
      .subtract(1, "day")
      .utc();
    const replacements = {
      last_updated_at: options.last_updated_at || oneDayAgo.toISOString(),
      import_start_date: moment()
        .subtract(this.ship.private_settings.import_days, "days")
        .format()
    };

    const wrappedQuery = this.adapter.in.wrapQuery(query, replacements);

    this.hull.logger.info("incoming.job.query", {
      jobName: "run",
      query: wrappedQuery,
      type: this.import_type
    });

    let openClient;

    return this.createClient()
      .then(client => {
        openClient = client;
        return this.adapter.in.runQuery(client, wrappedQuery, options);
      })
      .then(result => {
        this.closeClient(openClient);

        const { errors } = this.adapter.in.validateResult(
          result,
          this.import_type
        );
        if (errors && errors.length > 0) {
          return { entries: result.rows, errors };
        }

        return { entries: result.rows };
      })
      .catch(err => {
        this.closeClient(openClient);
        return Promise.reject(this.handleAndReturnAppropriateError(err));
      });
  }

  startImport(options = {}) {
    this.hull.logger.info("incoming.job.start", {
      jobName: "sync",
      type: this.import_type,
      options
    });
    const query = this.getQuery();
    const started_sync_at = new Date();
    if (!options.import_days) {
      options.import_days = FULL_IMPORT_DAYS;
    }
    if (!options.last_updated_at) {
      options.last_updated_at = moment()
        .subtract(FULL_IMPORT_DAYS, "days")
        .toISOString();
    }

    let openClient;

    return this.createClient()
      .then(client => {
        openClient = client;
        return this.streamQuery(client, query, options);
      })
      .then(stream => this.sync(stream, started_sync_at))
      .then(result => {
        // we weren't closing client after the stream was complete
        // should close and continue to return result
        this.closeClient(openClient);
        return Promise.resolve(result);
      })
      .catch(err => {
        this.closeClient(openClient);
        return Promise.reject(this.handleAndReturnAppropriateError(err));
      });
  }

  startSync(options = {}) {
    const private_settings = this.ship.private_settings;
    const oneHourAgo = moment()
      .subtract(1, "hour")
      .utc();
    options.import_days = private_settings.import_days;
    const last_updated_at =
      private_settings.last_updated_at ||
      private_settings.last_sync_at ||
      oneHourAgo.toISOString();
    return this.startImport({ ...options, last_updated_at });
  }

  streamQuery(client, query, options = {}) {
    const { last_updated_at } = options;
    const replacements = {
      last_updated_at,
      import_start_date: moment()
        .subtract(options.import_days, "days")
        .format()
    };
    // Wrap the query.
    const wrappedQuery = this.adapter.in.wrapQuery(query, replacements);

    this.hull.logger.info("incoming.job.query", {
      jobName: "sync",
      query: wrappedQuery,
      type: this.import_type
    });

    // Run the method for the specific adapter.
    return this.adapter.in.streamQuery(client, wrappedQuery).then(
      stream => {
        return stream;
      },
      err => {
        this.hull.logger.error("incoming.job.error", {
          jobName: "sync",
          errors: _.invoke(err, "toString") || err,
          hull_summary: _.get(
            err,
            "message",
            "Server Error: Error while streaming query from database"
          ),
          type: this.import_type
        });
        err.status = 403;
        throw err;
      }
    );
  }

  /**
   * Stream a wrapped query.
   *
   * Params:
   *   @connection_string String*
   *   @query String*
   *   @callback Function*
   *
   * Return:
   *   @callback Function
   *     - @error Object
   *     - @success Object
   */

  idKey() {
    return this.import_type === "accounts" ? "accountId" : "userId";
  }

  dataKey() {
    return this.import_type === "events" ? "properties" : "traits";
  }

  sync(stream, started_sync_at) {
    let processed = 0;
    let last_updated_at;
    const jobId = _.get(this, "job.id", uuid()); // ID of the job chunk
    const importId = uuid(); // ID of the whole job

    const transform = map({ objectMode: true }, rawRecord => {
      const data = {}; // data formated to be sent to hull
      processed += 1;

      if (processed % 1000 === 0) {
        const elapsed = new Date() - started_sync_at;
        this.hull.logger.info("incoming.job.progress", {
          jobId,
          jobName: "sync",
          stepName: "query",
          progress: processed,
          elapsed,
          type: this.import_type
        });
        if (this.job && this.job.queue && this.job.queue.client) {
          try {
            this.job.queue.client.extendLock(this.job.queue, this.job.id);
            this.job.progress(processed);
          } catch (err) {
            this.hull.logger.debug("unsupported.adapter.operation", {
              errors: err
            });
            // unsupported adapter operation
          }
        }
      }

      try {
        if (processed % 500 === 0) {
          this.hull.logger.debug("incoming.job.memory", {
            jobId,
            jobName: "sync",
            stepName: "query",
            progress: processed,
            type: this.import_type,
            usage: process.memoryUsage()
          });
        }
      } catch (error) {
        return Promise.resolve();
      }

      const record = this.adapter.in.transformRecord
        ? this.adapter.in.transformRecord(rawRecord, this.ship.private_settings)
        : rawRecord;

      // Add the external_id if exists.
      if (!_.isNil(record.external_id)) {
        data[this.idKey()] = record.external_id.toString();
      }

      if (record.updated_at) {
        last_updated_at = last_updated_at || record.updated_at;
        if (record.updated_at >= last_updated_at) {
          last_updated_at = record.updated_at;
        }
      }

      const omitTraits = ["external_id", "updated_at"];

      // Extract account external_id when linking to users
      if (this.import_type === "users" && record.account_id) {
        data.accountId = record.account_id;
        omitTraits.push("account_id");
      } else if (this.import_type === "events") {
        data.timestamp = record.timestamp;
        data.event = record.event;
        data.eventId = record.event_id;
        omitTraits.push("timestamp", "event", "event_id");
      }

      // Register everything else inside the "traits" object.
      data[this.dataKey()] = _.omit(record, omitTraits);
      return data;
    });

    let numBatches = 1;
    let numUsers = 0;
    let currentStream = null;
    let currentPromise = null;
    const { batchSize, adapter, ship } = this;

    let last_job_id = null;
    return new Promise((resolve, reject) => {
      ps.wait(
        stream
          .on("error", err => {
            this.hull.logger.error("incoming.job.error", {
              jobName: "sync",
              errors: _.invoke(err, "toString") || err,
              hull_summary: _.get(
                err,
                "message",
                "Server Error: Error while streaming query from database"
              ),
              type: this.import_type
            });

            if (stream.close) stream.close();
            // Don't do this so deep down, handling it in the catch attached to synch()
            // after reject is called, it will close
            // this.adapter.in.closeConnection(this.client);
            reject(err);
          })
          .pipe(transform)
          .pipe(
            through2(
              { objectMode: true, highWaterMark: 10 },
              function rotate(user, enc, callback) {
                try {
                  if (currentStream === null || numUsers % batchSize === 0) {
                    numBatches += 1;
                    if (currentStream) {
                      currentStream.end();
                      this.push(currentPromise);
                    }
                    const newUpload = adapter.out.upload(
                      ship.id,
                      numBatches - 1
                    );
                    currentStream = newUpload.stream;
                    currentPromise = newUpload.promise;
                  }
                  currentStream.write(`${JSON.stringify(user)}\n`);
                  numUsers += 1;
                  callback();
                } catch (e) {
                  throw e;
                }
              },
              function finish(callback) {
                if (currentStream && currentStream.end) {
                  // Readable does not implement end function,
                  // so we need to be careful here.
                  currentStream.end();
                }
                this.push(currentPromise);
                callback();
              }
            )
          )
          .pipe(
            ps.map({ highWaterMark: 1 }, ({ url, partNumber, size }) => {
              return (() => {
                this.hull.logger.info("incoming.job.progress", {
                  jobName: "sync",
                  stepName: "upload",
                  progress: partNumber,
                  size,
                  type: this.import_type
                });
                if (size > 0) {
                  return this.startImportJob(url, partNumber, size, importId);
                }
                return false;
              })().then(({ job }) => {
                last_job_id = job.id;
                this.hull.logger.info("incoming.job.progress", {
                  jobName: "sync",
                  stepName: "import",
                  progress: partNumber,
                  job,
                  type: this.import_type
                });
                return { job };
              });
            })
          )
      )
        .then(() => {
          const duration = new Date() - started_sync_at;

          this.metric.increment(`ship.incoming.${this.import_type}`, processed);
          if (processed === 0) {
            this.hull.logger.warn("incoming.job.warning", {
              hull_summary: "Warning: Saved query returned no results"
            });
          }
          this.hull.logger.info("incoming.job.success", {
            jobName: "sync",
            duration,
            progress: processed,
            type: this.import_type
          });

          const settings = {
            last_sync_at: started_sync_at,
            last_updated_at: last_updated_at || started_sync_at
          };

          if (last_job_id) {
            settings.last_job_id = last_job_id;
          }
          return this.hull.utils.settings
            .update(settings)
            .then(() => {
              if (_.get(this.ship, "status.status") === "error") {
                return this.hull.put("app/status", {
                  status: "ok"
                });
              }
              return Promise.resolve();
            })
            .then(resolve);
        })
        .catch(err => {
          this.hull.logger.error("incoming.job.error", {
            jobName: "sync",
            errors: _.get(err, "message", err),
            hull_summary: _.get(
              err,
              "message",
              "Server Error: Encountered error during sync operation"
            ),
            type: this.import_type
          });
          this.hull.put("app/status", {
            status: "error",
            messages: [_.get(err, "message", err)]
          });
          reject(err);
        });
    });
  }

  startImportJob(url, partNumber, size, importId) {
    const { dedupe_lines_from_previous_import = false } = this.ship.private_settings;
    const params = {
      url,
      format: "json",
      notify: true,
      emit_event: false,
      name: `Import from hull-sql-importer ${this.ship.name} - part ${partNumber}`,
      // scheduling all parts for right now.  Doesn't seem to work if schedule_at is removed
      // dashboard says "Invalid Date"
      schedule_at: moment().toISOString(),
      stats: { size },
      size,
      import_id: importId,
      part_number: partNumber,
      dedupe: dedupe_lines_from_previous_import
    };

    this.hull.logger.info("incoming.job.progress", {
      jobName: "sync",
      stepName: "import",
      progress: partNumber,
      options: _.omit(params, "url"),
      type: this.import_type
    });

    return this.hull.post(`/import/${this.import_type}`, params).then(job => {
      return { job, partNumber };
    });
  }
}
