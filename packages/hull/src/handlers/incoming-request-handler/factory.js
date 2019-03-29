// @flow
import type { Router } from "express";
import type { HullIncomingHandlerConfigurationEntry } from "../../types";

import getRouter from "../get-router";
import errorHandler from "../error-handler";
import handler from "../external-handler";
/**
 * @param {Object|Function} callback         [description]
 * @param {Object}   options [description]
 * @param {number}   options.maxSize [description]
 * @param {number}   options.maxTime [description]
 */
function incomingRequestHandlerFactory(
  configurationEntry: HullIncomingHandlerConfigurationEntry
): Router {
  const { options = {} } = configurationEntry;
  return getRouter({
    options: {
      credentialsFromQuery: true,
      credentialsFromNotification: false,
      respondWithError: true,
      strict: false,
      ...options
    },
    requestName: "requests-buffer",
    handler: handler(configurationEntry),
    errorHandler: errorHandler(options)
  });
}

module.exports = incomingRequestHandlerFactory;
