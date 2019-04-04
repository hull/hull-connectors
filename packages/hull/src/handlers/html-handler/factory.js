// @flow
import type { Router } from "express";
import type { HullHtmlHandlerConfigurationEntry } from "../../types";

import getRouter from "../get-router";
import errorHandler from "../error-handler";
import handler from "../external-handler";
import oAuthHandler from "../oauth-handler/factory";

/**
 * @TODO the logic for this should be combined with jsonHandler
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
  configurationEntry: HullHtmlHandlerConfigurationEntry
): void | Router {
  const { options = {} } = configurationEntry;
  const { type } = options;
  if (type === "oAuth") {
    return oAuthHandler(configurationEntry);
  }

  return getRouter({
    options: {
      credentialsFromQuery: true,
      credentialsFromNotification: false,
      respondWithError: true,
      strict: false,
      ...options
    },
    requestName: "action",
    handler: handler({
      ...configurationEntry,
      options: {
        format: "html",
        ...options
      }
    }),
    errorHandler: errorHandler(options)
  });
}

module.exports = htmlHandlerFactory;
