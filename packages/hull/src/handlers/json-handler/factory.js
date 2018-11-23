// @flow
import type { $Response, NextFunction } from "express";
import type {
  HullHandlersConfigurationEntry,
  HullContextFull,
  HullRequestFull
} from "../../types";

type HullJsonHandlerOptions = {
  cache?: {
    key?: string,
    options?: Object
  },
  disableErrorHandling?: boolean,
  respondWithError?: boolean
};

type HullJsonHandlerCallback = (ctx: HullContextFull) => Promise<*>;

type HullJsonHandlerConfigurationEntry = HullHandlersConfigurationEntry<
  HullJsonHandlerCallback,
  HullJsonHandlerOptions
>;

const debug = require("debug")("hull-connector:json-handler");
const { Router } = require("express");
const cors = require("cors");

const { TransientError } = require("../../errors");
const {
  credentialsFromQueryMiddleware,
  fullContextFetchMiddleware,
  timeoutMiddleware,
  haltOnTimedoutMiddleware,
  clientMiddleware,
  instrumentationContextMiddleware,
  instrumentationTransientErrorMiddleware
} = require("../../middlewares");
const { normalizeHandlersConfigurationEntry } = require("../../utils");

/**
 * This handler allows to handle simple, authorized HTTP calls.
 * By default it picks authorization configuration from query.
 *
 * If you need custom way of passing data, you need to use custom middleware before the handler.
 *
 * Optionally it can cache the response, to use it provide `options.cache` parameter with cache key
 * Metrics:
 * connector.json-handler.requests
 * connector.json-handler.duration
 * connector.json-handler.api-calls
 *
 *
 * @param  {Object|Function} configurationEntry [description]
 * @param  {Object} [configurationEntry.options]
 * @param  {Object} [configurationEntry.options.disableErrorHandling] if you want to disable internal
 * @param  {Object} [configurationEntry.options.cache]
 * @param  {string} [configurationEntry.options.cache.key]
 * @param  {string} [configurationEntry.options.cache.options]
 * @return {Function}
 * @example
 * const { jsonHandler } = require("hull/lib/handlers");
 * app.use("/list", jsonHandler((ctx) => {}))
 */
function jsonHandlerFactory(
  configurationEntry: HullJsonHandlerConfigurationEntry
): Router {
  const { callback, options } = normalizeHandlersConfigurationEntry(
    configurationEntry
  );
  const {
    cache = {},
    disableErrorHandling = false,
    respondWithError = false
  } = options;
  debug("options", options);
  const router = Router();
  router.use(credentialsFromQueryMiddleware()); // parse config from query
  router.use(timeoutMiddleware());
  router.use(clientMiddleware()); // initialize client
  router.use(haltOnTimedoutMiddleware());
  router.use(instrumentationContextMiddleware());
  router.use(fullContextFetchMiddleware({ requestName: "action" }));
  router.use(haltOnTimedoutMiddleware());
  router.use(cors());
  router.use(function jsonHandler(
    req: HullRequestFull,
    res: $Response,
    next: NextFunction
  ) {
    (() => {
      debug("processing");
      if (cache && cache.key) {
        return req.hull.cache.wrap(
          cache.key,
          () => {
            // $FlowFixMe
            return callback(req.hull);
          },
          cache.options || {}
        );
      }
      debug("calling callback");
      return callback(req.hull);
    })()
      .then(response => {
        debug("callback response", response);
        if (typeof response === "string") {
          return res.json({ response });
        }
        return res.json(response);
      })
      .catch(error => next(error));
  });
  router.use(instrumentationTransientErrorMiddleware());
  if (disableErrorHandling !== true) {
    router.use(function jsonHandlerErrorMiddleware(
      err: Error,
      req: HullRequestFull,
      res: $Response,
      next: NextFunction
    ) {
      debug("error", err.message, err.constructor.name, { respondWithError });

      // if we have non transient error
      if (err instanceof TransientError) {
        res.status(503);
      }

      if (respondWithError) {
        res.json({ error: err.toString() });
      } else {
        res.json({ error: true });
      }
      // if we have non transient error
      if (!(err instanceof TransientError)) {
        next(err);
      }
    });
  }

  return router;
}

module.exports = jsonHandlerFactory;
