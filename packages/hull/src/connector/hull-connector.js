// @flow

import type { $Application, Middleware } from "express";
import type { Server } from "http";
import _ from "lodash";
import express from "express";
import type {
  HullServerConfig,
  HullMetricsConfig,
  HullLogsConfig,
  HullClientConfig,
  HullWorkerConfig,
  HullConnectorConfig,
  HullClient,
  HullWorker
} from "../types";

import {
  jsonHandler,
  scheduleHandler,
  notificationHandler,
  batchHandler,
  incomingRequestHandler,
  htmlHandler,
  statusHandler
} from "../handlers";

import errorHandler from "./error";

const path = require("path");
const Promise = require("bluebird");
const { renderFile } = require("ejs");
const debug = require("debug")("hull-connector");

const { staticRouter } = require("../utils");
const Worker = require("./worker");
const { Instrumentation, Cache, Queue, Batcher } = require("../infra");
const { onExit } = require("../utils");
const {
  hullContextMiddleware,
  baseComposedMiddleware
} = require("../middlewares");

function getAbsolutePath(p) {
  return `${path.dirname(path.join(require.main.filename, ".."))}/${p}`;
}

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
  middlewares: $PropertyType<HullConnectorConfig, "middlewares">;

  handlers: $PropertyType<HullConnectorConfig, "handlers">;

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
      handlers,
      disableOnExit = false
    } = connectorConfig;

    this.connectorConfig = connectorConfig;
    this.clientConfig = {
      ...clientConfig,
      connectorName: clientConfig.connectorName || connectorName
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
    this.handlers = handlers;
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

  async start() {
    if (this.serverConfig.start) {
      const app = express();
      this.app = app;
      this.setupApp(app);
      this.setupRoutes(app);
      if (this.connectorConfig.devMode) {
        debug("Starting Server in DevMode");
        // eslint-disable-next-line global-require
        const webpackDevMode = require("./dev-mode");

        webpackDevMode(app, {
          port: this.connectorConfig.port,
          source: getAbsolutePath("src"),
          destination: getAbsolutePath("dist")
        });
      } else {
        debug("Starting Server");
      }
      const server = this.startApp(app);
      if (server) {
        this.server = server;
      }
      console.log(`Started server on port ${this.connectorConfig.port}`);
    } else {
      debug("No Server started: `serverConfig.start === false`");
    }

    if (this.workerConfig.start) {
      this.startWorker(this.workerConfig.queueName);
    } else {
      debug("No Worker started: `workerConfig.start` is false");
    }
  }

  setupRoutes(app: $Application) {
    const {
      schedules,
      statuses,
      batches,
      notifications,
      json,
      incoming,
      routers,
      html
      // $FlowFixMe
    } = _.isFunction(this.handlers) ? this.handlers(this) : this.handlers;

    // Don't use an arrow function here as it changes the context
    // Don't move it out of this closure either
    // https://github.com/expressjs/express/issues/3855
    function getMethod(method) {
      const m = method.toLowerCase();
      switch (m) {
        case "all":
          return app.all;
        case "get":
          return app.get;
        case "put":
          return app.put;
        case "patch":
          return app.patch;
        case "delete":
          return app.delete;
        default:
          return undefined;
      }
    }

    // This method wires the routes according to the configuration.
    // Methods are optional but they all have sane defaults

    // Setup Batch handlers
    (batches || []).map(({ url, handlers }) =>
      app.post(url, batchHandler(handlers))
    );

    // Setup Kraken handlers
    (notifications || []).map(({ url, handlers }) =>
      app.post(url, notificationHandler(handlers))
    );

    // Statuses handlers
    // Be careful - these handlers return a specific data format
    (statuses || []).map(({ url, method = "all", handler }) => {
      const run = getMethod(method);
      if (run) {
        // $FlowFixMe
        app[method](url, statusHandler(handler));
      }
      return true;
    });

    // Setup JSON handlers
    (json || []).map(({ url, method = "all", handler }) => {
      const run = getMethod(method);
      if (run) {
        // $FlowFixMe
        app.all(url, jsonHandler(handler));
      }
      return true;
    });

    // Setup Incoming handlers
    (schedules || []).map(({ url, method = "all", handler }) => {
      const run = getMethod(method);
      if (run) {
        // $FlowFixMe
        app[method](url, scheduleHandler(handler));
      }
      return true;
    });

    // Setup Incoming handlers
    (incoming || []).map(({ url, method = "post", handler }) => {
      const run = getMethod(method);
      if (run) {
        // $FlowFixMe
        app[method](url, incomingRequestHandler(handler));
      }
      return true;
    });

    // Setup HTML
    (html || []).map(({ url, method = "get", handler }) => {
      const run = getMethod(method);
      if (run) {
        // $FlowFixMe
        app[method](url, htmlHandler(handler));
      }
      return true;
    });

    // Setup Routers
    (routers || []).map(({ url, handler }) => app.use(url, handler));
  }

  baseComposedMiddleware() {
    return baseComposedMiddleware({
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
    app.use(this.baseComposedMiddleware());
    app.use("/", staticRouter());
    app.engine("html", renderFile);
    app.set("views", getAbsolutePath("views"));
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
  startApp(app: $Application): Promise<?Server> {
    const { port } = this.connectorConfig;
    return app.listen(port, () => debug("connector.server.listen", { port }));
  }

  worker(jobs: Object) {
    this._worker = new this.Worker({
      instrumentation: this.instrumentation,
      queue: this.queue
    });
    this._worker.use(this.baseComposedMiddleware());
    this._worker.use(hullContextMiddleware());
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
