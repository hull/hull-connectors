// @flow

import type { $Application, Middleware } from "express";
import type { Server } from "http";
import express from "express";
import type {
  HullServerConfig,
  HullRouteMap,
  HullMetricsConfig,
  HullLogsConfig,
  HullCacheConfig,
  HullHTTPClientConfig,
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
  OAuthHandler,
  statusHandler
} from "../handlers";

import errorHandler from "./error";

type RouterFactory = configurationEntry => void | HullRouteMap;

const path = require("path");
const Promise = require("bluebird");
const { renderFile } = require("ejs");
const debug = require("debug")("hull-connector");

const { staticRouter } = require("../utils");
const Worker = require("./worker");
const { Instrumentation, Cache, Queue, Batcher } = require("../infra");
const { onExit } = require("../utils");
const {
  workerContextMiddleware,
  baseComposedMiddleware
} = require("../middlewares");

const getAbsolutePath = p =>
  `${path.dirname(path.join(require.main.filename, ".."))}/${p}`;

const getCallbacks = (handlers, category: string, handler: string) => {
  const cat = handlers[category];
  if (!cat) {
    throw new Error(
      `Trying to access an undefined handler category ${category}`
    );
  }
  const callback = cat[handler];
  if (!callback) {
    debug(`error in handlers ${category}`, cat);
    throw new Error(
      `Trying to access an undefined handler ${handler} in ${category}`
    );
  }
  return callback;
};

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

  _handlers: $PropertyType<HullConnectorConfig, "handlers">;

  manifest: $PropertyType<HullConnectorConfig, "manifest">;

  resolvedConfig: HullConnectorConfig;

  connectorConfig: HullConnectorConfig;

  serverConfig: HullServerConfig;

  workerConfig: HullWorkerConfig;

  httpClientConfig: HullHTTPClientConfig;

  clientConfig: HullClientConfig;

  metricsConfig: HullMetricsConfig;

  logsConfig: HullLogsConfig;

  cacheConfig: HullCacheConfig;

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
    connectorConfig: HullConnectorConfig | (() => HullConnectorConfig)
  ) {
    const resolvedConfig =
      typeof connectorConfig === "function"
        ? connectorConfig()
        : connectorConfig;
    const {
      manifest,
      instrumentation,
      cacheConfig,
      queue,
      clientConfig,
      serverConfig,
      workerConfig,
      httpClientConfig,
      metricsConfig,
      logsConfig,
      connectorName,
      middlewares = [],
      handlers,
      disableOnExit = false
    } = resolvedConfig;

    this.resolvedConfig = resolvedConfig;
    this.clientConfig = {
      ...clientConfig,
      connectorName: clientConfig.connectorName || connectorName
    };
    this.logsConfig = logsConfig || {};
    this.metricsConfig = metricsConfig || {};
    this.cacheConfig = {
      ttl: 60, // Seconds
      max: 100, // Items
      store: "memory",
      ...cacheConfig
    };
    this.cache = new Cache(this.cacheConfig);
    this.workerConfig = workerConfig || {};
    this.httpClientConfig = httpClientConfig || {};
    this.serverConfig = serverConfig || { start: true };
    this.Client = dependencies.Client;
    this.Worker = dependencies.Worker;
    this.middlewares = middlewares;
    this.handlers = handlers;
    this.manifest = manifest;
    this.instrumentation =
      instrumentation || new Instrumentation(this.metricsConfig, manifest);
    this.queue = queue || new Queue();

    // Rebuild a sanitized and defaults-enriched Conenctor Config
    this.connectorConfig = {
      ...resolvedConfig,
      clientConfig: this.clientConfig,
      workerConfig: this.workerConfig,
      httpClientConfig: this.httpClientConfig,
      serverConfig: this.serverConfig,
      metricsConfig: this.metricsConfig,
      logsConfig: this.logsConfig,
      cacheConfig: this.cacheConfig
    };

    if (this.logsConfig.logLevel) {
      this.Client.logger.transports.console.level = this.logsConfig.logLevel;
    }

    if (disableOnExit !== true) {
      onExit(() => Promise.all([Batcher.exit(), this.queue.exit()]));
    }
  }

  async start() {
    if (this.workerConfig.start) {
      this.startWorker(this.workerConfig.queueName);
    } else {
      debug("No Worker started: `workerConfig.start` is false");
    }
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
  }

  getHandlers() {
    if (this._handlers) {
      return this._handlers;
    }
    this._handlers =
      typeof this.handlers === "function" ? this.handlers(this) : this.handlers;
    return this._handlers;
  }

  setupRoutes(app: $Application) {
    const handlers = this.getHandlers();
    // Don't use an arrow function here as it changes the context
    // Don't move it out of this closure either
    // https://github.com/expressjs/express/issues/3855

    // This method wires the routes according to the configuration.
    // Methods are optional but they all have sane defaults
    const mapNotification = (factory, section = "subscriptions") =>
      (this.manifest[section] || []).map(({ url, channels }) => {
        const { router } = factory(
          channels.map(({ handler, channel, options }) => ({
            callback: getCallbacks(handlers, section, handler),
            channel,
            options
          }))
        );
        app.post(url, router);
      });

    // Breaking proper separation of concerns here, but its the least invasive way to override route setup with oAuth handlers
    const mapRoute = (
      factory: RouterFactory,
      section = "json",
      defaultMethod = "all"
    ) =>
      (this.manifest[section] || []).map(
        ({ url, method = defaultMethod, handler, options }) => {
          const callback = getCallbacks(handlers, section, handler);
          if (!callback) {
            throw new Error(
              `Trying to setup a handler ${handler} that doesn't exist for url ${url}. Can't continue`
            );
          }
          // $FlowFixMe
          if (!app[method || defaultMethod]) {
            throw new Error(
              `Trying to setup an unauthorized method: app.${method}`
            );
          }
          const res = factory({
            method: method || defaultMethod,
            options,
            callback
          });
          if (!res) {
            debug(
              `Skipping entry because no router was returned for ${section} / ${url}: ${handler}`
            );
            return false;
          }
          const { method: routerMethod, router } = res;
          // const m = handleMethod(method, defaultMethod, options)
          if (router) {
            // $FlowFixMe
            app[routerMethod](url, router);
            // app[method || defaultMethod](url, router);
            debug(
              `Setting up ${routerMethod.toUpperCase()} ${url}: ${handler} / ${!!callback}`
            );
          } else {
            debug(
              `Skipping ${routerMethod.toUpperCase()} ${url} ${handler} because no router was generated`
            );
          }
          return true;
        }
      );

    // Setup Kraken handlers
    mapNotification(notificationHandler, "subscriptions");

    // Setup Batch handlers
    mapNotification(batchHandler, "batches");

    // Statuses handlers
    // Be careful - these handlers return a specific data format
    mapRoute(statusHandler, "statuses", "all");

    // Setup Schedule handlers
    mapRoute(scheduleHandler, "schedules", "all");

    // Setup Tab handlers
    mapRoute(htmlHandler, "tabs", "all");

    // Alpha-quality Credentials handlers - DO NOT expose both tab oAuth and Credentials
    mapRoute(OAuthHandler, "credentials", "all");

    // Setup HTML handlers
    mapRoute(htmlHandler, "html", "get");

    // Setup JSON handlers
    mapRoute(jsonHandler, "json", "all");

    // Setup Incoming Data handlers
    mapRoute(incomingRequestHandler, "incoming", "all");
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
    this.middlewares.map(middleware => app.use(middleware));
    app.use(this.baseComposedMiddleware());
    app.use("/", staticRouter());
    app.engine("html", renderFile);
    app.set("views", getAbsolutePath("views"));
    app.set("view engine", "ejs");

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

  use(middleware: Middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  startWorker(queueName?: string = "queueApp"): Worker {
    this.instrumentation.exitOnError = true;
    const { jobs } = this.getHandlers();
    if (!jobs) {
      throw new Error(
        "Worker is started but no jobs hash is declared in Handlers"
      );
    }
    this._worker = new this.Worker({
      instrumentation: this.instrumentation,
      queue: this.queue,
      jobs
    });
    this.middlewares.map(this._worker.use);
    this._worker.use(this.baseComposedMiddleware());
    this._worker.use(workerContextMiddleware());
    this._worker.process(queueName);
    debug("connector.worker.process", { queueName });
    return this._worker;
  }
}

module.exports = HullConnector;
