// @flow
import type { Router } from "express";
import type { HullSchedulerHandlerConfigurationEntry } from "../../types";

import getRouter from "../get-router";
import errorHandler from "../error-handler";
import handler from "../external-handler";

/**
 * This handler allows to handle simple, authorized HTTP calls.
 * By default it picks authorization configuration from query.
 *
 * If you need custom way of passing data, you need to use custom middleware before the handler.
 *
 * Optionally it can cache the response, then provide options.cache object with key
 *
 * @param  {Object|Function} configurationEntry [description]
 * @param  {Object}   [configurationEntry.options]
 * @param  {Object}   [configurationEntry.options.cache]
 * @param  {string}   [configurationEntry.options.cache.key]
 * @param  {string}   [configurationEntry.options.cache.options]
 * @return {Function}
 * @example
 * app.use("/list", actionHandler((ctx) => {}))
 */
function scheduleHandlerFactory(
  configurationEntry: HullSchedulerHandlerConfigurationEntry
): Router {
  const { options = {} } = configurationEntry;

  return getRouter({
    options: {
      credentialsFromQuery: true,
      credentialsFromNotification: false,
      respondWithError: true,
      strict: true,
      ...options
    },
    requestName: "scheduler",
    handler: handler(configurationEntry),
    errorHandler: errorHandler(options)
  });
}

module.exports = scheduleHandlerFactory;
