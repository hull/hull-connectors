// @flow
import type {
  $Application,
  $Response,
  NextFunction,
  Middleware
} from "express";
import { json as jsonParser } from "express";
import type { HullRequest } from "../types";
import type { HullConnectorConfig } from "../../../types";

const _ = require("lodash");
const path = require("path");
const Promise = require("bluebird");
const { renderFile } = require("ejs");
const debug = require("debug")("hull-connector");

const HullClient = require("hull-client");
const { staticRouter } = require("../utils");
const Worker = require("./worker");
const { hullContextMiddleware } = require("../middlewares");
const { Instrumentation, Cache, Queue, Batcher } = require("../infra");
const { onExit } = require("../utils");
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

  connectorConfig: $Shape<HullConnectorConfig>;

  cache: Cache;

  queue: Queue;

  instrumentation: Instrumentation;

  clientConfig: $PropertyType<HullConnectorConfig, "clientConfig">;

  _worker: Worker;

  Worker: typeof Worker;

  HullClient: typeof HullClient;

  static bind: Function;

  constructor(dependencies: Object, connectorConfig: HullConnectorConfig) {
    const {
      captureMetrics,
      instrumentation = new Instrumentation({ captureMetrics }),
      cache = new Cache(),
      queue = new Queue(),
      clientConfig,
      connectorName,
      middlewares = [],
      captureLogs,
      disableOnExit = false
    } = connectorConfig;

    this.connectorConfig = {
      skipSignatureValidation: false,
      json: { limit: "10mb" },
      ...connectorConfig
    };
    this.clientConfig = {
      ...clientConfig,
      connectorName: clientConfig.connectorName || connectorName,
      logs: clientConfig.logs || captureLogs
    };
    this.HullClient = dependencies.HullClient;
    this.Worker = dependencies.Worker;
    this.middlewares = middlewares;
    this.instrumentation = instrumentation;
    this.cache = cache;
    this.queue = queue;

    if (disableOnExit !== true) {
      onExit(() => {
        return Promise.all([Batcher.exit(), this.queue.exit()]);
      });
    }
  }

  /**
   * This method returns a Hull Middleware that you can insert in your   requests to hydrate the full context.
   * @public
   * @return {hullContextMiddleware} a node middleware that hydrates the hull context
   */
  middleware(): Middleware {
    return hullContextMiddleware({
      HullClient,
      connectorConfig: this.connectorConfig,
      instrumentation: this.instrumentation,
      queue: this.queue,
      cache: this.cache
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
    app.use((req, res, next: NextFunction) => {
      debug(
        "incoming request",
        _.pick(req, "headers", "url", "method", "body")
      );
      next();
    });
    app.use(jsonParser(this.connectorConfig.json));
    app.use("/", staticRouter());
    app.use(this.instrumentation.startMiddleware());
    app.engine("html", renderFile);

    const applicationDirectory = path.dirname(
      path.join(require.main.filename, "..")
    );
    app.set("views", `${applicationDirectory}/views`);
    app.set("view engine", "ejs");
    this.middlewares.map(middleware => app.use(middleware));
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
  startApp(app: $Application) {
    /**
     * Instrumentation Middleware,
     * this sends all errors to sentry
     */
    app.use(this.instrumentation.stopMiddleware());

    /**
     * Unhandled error middleware
     */
    app.use(
      (err: Error, req: HullRequest, res: $Response, _next: NextFunction) => {
        // eslint-disable-line no-unused-vars
        debug("unhandled-error", err.stack);
        if (!res.headersSent) {
          res.status(500).send("unhandled-error");
        }
      }
    );

    return app.listen(this.connectorConfig.port, () => {
      debug("connector.server.listen", { port: this.connectorConfig.port });
    });
  }

  worker(jobs: Object) {
    this._worker = new this.Worker({
      instrumentation: this.instrumentation,
      queue: this.queue
    });
    this._worker.use(this.instrumentation.startMiddleware());
    this._worker.use(this.middleware());
    this.middlewares.map(middleware => this._worker.use(middleware));

    this._worker.setJobs(jobs);
    return this._worker;
  }

  use(middleware: Middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  startWorker(queueName: string = "queueApp") {
    this.instrumentation.exitOnError = true;
    if (this._worker) {
      this._worker.process(queueName);
      debug("connector.worker.process", { queueName });
    }
  }
}

module.exports = HullConnector;
