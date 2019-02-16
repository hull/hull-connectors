// @flow
import type { $Response, NextFunction } from "express";
import type {
  HullJsonHandlerConfigurationEntry,
  HullRequestFull
} from "../../types";

const debug = require("debug")("hull-connector:html-handler");
const { Router } = require("express");

const { TransientError } = require("../../errors");
const {
  credentialsFromQueryMiddleware,
  fullContextFetchMiddleware,
  timeoutMiddleware,
  haltOnTimedoutMiddleware,
  clientMiddleware,
  instrumentationContextMiddleware
} = require("../../middlewares");

/**
 * TODO the logic for this should be combined with jsonHandler
 * should we use inheritance, composition or a functional approach to keep this code DRY?
 * or should we abide by the abstraction rule of 3, and allow this second implementation to be ok for now
 *
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
 * app.use("/list", htmlHandler((ctx) => {}))
 */
function htmlHandlerFactory(
  configurationEntry: HullJsonHandlerConfigurationEntry
): Router {
  const { callback, options } = configurationEntry;
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
  router.use(function htmlHandler(
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
      // $FlowFixMe
      return callback(req.hull);
    })()
      .then(response => {
        debug("callback response", response);
        if (response.pageLocation != null) {
          if (response.data != null) {
            return res.render(response.pageLocation, response.data);
          }
          return res.render(response.pageLocation);
        }

        return res.json({ error: "pageLocation required" });
      })
      .catch(error => next(error));
  });
  if (disableErrorHandling !== true) {
    router.use(function htmlHandlerErrorMiddleware(
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

      // How do we want to respond?  With json?
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

module.exports = htmlHandlerFactory;
