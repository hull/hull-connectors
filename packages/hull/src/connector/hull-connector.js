// @flow

import type { $Application, Middleware } from "express";
import type { Server } from "http";
import express from "express";
import type {
  HullServerConfig,
  HullMetricsConfig,
  HullLogsConfig,
  HullClientConfig,
  HullWorkerConfig,
  HullConnectorConfig,
  HullContextMiddlewareParams,
  HullClient,
  HullWorker
} from "../types";

import errorHandler from "./error";

const path = require("path");
const Promise = require("bluebird");
const { renderFile } = require("ejs");
const debug = require("debug")("hull-connector");

const { staticRouter } = require("../utils");
const Worker = require("./worker");
const { hullContextMiddleware } = require("../middlewares");
const { Instrumentation, Cache, Queue, Batcher } = require("../infra");
const { onExit } = require("../utils");
const { hullBaseMiddleware } = require("../middlewares");

// const { TransientError } = require("../errors");

/**
 * An object that's available in all action handlers and routers as `req.hull`.
 * It's a set of parameters and modules to work in the context of current organization and connector instance.
 *
 * @namespace Context
 * @public
 */

/**
 * @public
 * @param {Object}        dependencies
 * @param {Object}        [options={}]
 * @param {string}        [options.connectorName] force connector name - if not provided will be taken from manifest.json
 * @param {string}        [options.hostSecret] secret to sign req.hull.token
 * @param {Number|string} [options.port] port on which expressjs application should be started
 * @param {Object}        [options.json] a Configuration to pass the body JSON parser, Default: { limit: "10mb" }
 * @param {Object}        [options.clientConfig] additional `HullClient` configuration
 * @param {boolean}       [options.skipSignatureValidation] skip signature validation on notifications (for testing only)
 * @param {number|string} [options.timeout] global HTTP server timeout - format is parsed by `ms` npm package
 * @param {Object}        [options.instrumentation] override default InstrumentationAgent
 * @param {Object}        [options.cache] override default CacheAgent
 * @param {Object}        [options.queue] override default QueueAgent
 * @param {Array}         [options.captureMetrics] an array to capture metrics
 * @param {Array}         [options.captureLogs] an array to capture logs
 * @param {boolean}       [options.disableOnExit=false] an optional param to disable exit listeners
 */
class HullConnector {
  middlewares: Array<Function>;

  connectorConfig: HullConnectorConfig;

  serverConfig: HullServerConfig;

  workerConfig: HullWorkerConfig;

  clientConfig: HullClientConfig;

  metricsConfig: HullMetricsConfig;

  logsConfig: HullLogsConfig;

  cache: Cache;

  queue: Queue;

  instrumentation: Instrumentation;

  _worker: Worker;

  Worker: Class<HullWorker>;

  Client: Class<HullClient>;

  static bind: Function;

  app: $Application;

  server: Server;

  constructor(
    dependencies: {
      Worker: Class<Worker>,
      Client: Class<HullClient>
    },
    connectorConfig: HullConnectorConfig
  ) {
    const {
      manifest,
      instrumentation,
      cache,
      queue,
      clientConfig,
      serverConfig,
      workerConfig,
      metricsConfig,
      logsConfig,
      connectorName,
      middlewares = [],
      captureLogs,
      disableOnExit = false
    } = connectorConfig;

    this.connectorConfig = connectorConfig;
    this.clientConfig = {
      ...clientConfig,
      connectorName: clientConfig.connectorName || connectorName,
      logs: clientConfig.logs || captureLogs
    };
    this.logsConfig = logsConfig || {};
    this.metricsConfig = metricsConfig || {};
    this.workerConfig = workerConfig || {};
    this.serverConfig = serverConfig || {
      start: true
    };
    this.Client = dependencies.Client;
    this.Worker = dependencies.Worker;
    this.middlewares = middlewares;
    this.instrumentation =
      instrumentation || new Instrumentation(this.metricsConfig, manifest);
    this.cache = cache || new Cache();
    this.queue = queue || new Queue();

    if (this.logsConfig.logLevel) {
      this.Client.logger.transports.console.level = this.logsConfig.logLevel;
    }

    if (disableOnExit !== true) {
      onExit(() => {
        return Promise.all([Batcher.exit(), this.queue.exit()]);
      });
    }
  }

  start() {
    if (this.serverConfig.start) {
      const app = express();
      this.app = app;
      if (this.connectorConfig.devMode) {
        debug("Starting Server in DevMode");
        // eslint-disable-next-line global-require
        const webpackDevMode = require("./dev-mode");
        webpackDevMode(app, {
          port: this.connectorConfig.port,
          source: "../src",
          destination: "../dist"
        });
      } else {
        debug("Starting Server");
      }
      this.setupApp(app);
      const server = this.startApp(app);
      this.server = server;
      console.log(`Started server on port ${this.connectorConfig.port}`);
    } else {
      debug("Not Starting Server because of `serverConfig`");
    }

    if (this.workerConfig.start) {
      this.startWorker(this.workerConfig.queueName);
    } else {
      debug("Not Worker Server because of `workerConfig`");
    }
  }

  /**
   * This method returns a Hull Middleware that you can insert in your   requests to hydrate the full context.
   * @public
   * @return {hullContextMiddleware} a node middleware that hydrates the hull context
   */
  contextMiddleware({
    requestName
  }: HullContextMiddlewareParams = {}): Middleware {
    return hullContextMiddleware({
      requestName
    });
  }

  baseMiddleware() {
    return hullBaseMiddleware({
      Client: this.Client,
      instrumentation: this.instrumentation,
      queue: this.queue,
      cache: this.cache,
      connectorConfig: this.connectorConfig
    });
  }

  /**
   * This method applies all features of `Hull.Connector` to the provided application:
   *   - serving `/manifest.json`, `/readme` and `/` endpoints
   *   - serving static assets from `/dist` and `/assets` directiories
   *   - rendering `/views/*.html` files with `ejs` renderer
   *   - timeouting all requests after 25 seconds
   *   - adding Newrelic and Sentry instrumentation
   *   - initiating the wole [Context Object](#context)
   *   - handling the `hullToken` parameter in a default way
   * @public
   * @param  {express} app expressjs application
   * @return {express}     expressjs application
   */
  setupApp(app: $Application): $Application {
    app.use(this.baseMiddleware());
    app.use("/", staticRouter());
    app.engine("html", renderFile);
    const applicationDirectory = path.dirname(
      path.join(require.main.filename, "..")
    );
    app.set("views", `${applicationDirectory}/views`);
    app.set("view engine", "ejs");
    this.middlewares.map(middleware => app.use(middleware));
    /**
     * Instrumentation Middleware,
     * this sends all errors to sentry
     */
    app.use(this.instrumentation.stopMiddleware());

    /**
     * Unhandled error middleware
     */
    app.use(errorHandler);

    return app;
  }

  /**
   * This is a supplement method which calls `app.listen` internally and also terminates instrumentation of the application calls.
   * If any error is not caught on handler level it will first go through instrumentation handler reporting it to sentry
   * and then a `500 Unhandled Error` response will be send back to the client.
   * The response can be provided by the handler before passing it here.
   * @public
   * @param  {express} app expressjs application
   * @return {http.Server}
   */
  startApp(app: $Application): Server {
    return app.listen(this.connectorConfig.port, () => {
      debug("connector.server.listen", { port: this.connectorConfig.port });
    });
  }

  worker(jobs: Object) {
    this._worker = new this.Worker({
      instrumentation: this.instrumentation,
      queue: this.queue
    });
    this._worker.use(this.baseMiddleware());
    this._worker.use(this.contextMiddleware());
    this.middlewares.map(middleware => this._worker.use(middleware));

    this._worker.setJobs(jobs);
    return this._worker;
  }

  use(middleware: Middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  startWorker(qn?: string | null): Worker {
    debug("Starting Worker");
    this.instrumentation.exitOnError = true;
    const queueName = qn || "queueApp";
    if (this._worker) {
      this._worker.process(queueName);
      debug("connector.worker.process", { queueName });
    }
    return this._worker;
  }
}

module.exports = HullConnector;
