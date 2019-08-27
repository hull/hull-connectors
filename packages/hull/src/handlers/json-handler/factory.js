// @flow

import type {
  HullRouteMap,
  HullJsonHandlerConfigurationEntry
} from "../../types";
import getRouter from "../get-router";
import errorHandler from "../error-handler";
import handler from "../external-handler";

const cors = require("cors");

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
): HullRouteMap {
  const { method, options = {} } = configurationEntry;

  return getRouter({
    method,
    options: {
      credentialsFromQuery: true,
      credentialsFromNotification: false,
      cacheContextFetch: false,
      respondWithError: true,
      strict: false,
      ...options
    },
    requestName: "action",
    beforeMiddlewares: [cors()],
    handler: handler(configurationEntry),
    errorHandler: errorHandler(options)
  });
}

module.exports = jsonHandlerFactory;
