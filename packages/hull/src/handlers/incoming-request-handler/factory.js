// @flow

import type {
  HullRouteMap,
  HullIncomingHandlerConfigurationEntry
} from "../../types";

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
): HullRouteMap {
  const { method, options = {} } = configurationEntry;
  return getRouter({
    method,
    options: {
      credentialsFromQuery: true,
      credentialsFromNotification: false,
      respondWithError: true,
      strict: false,
      ...options
    },
    requestName: "requests-buffer",
    handler: handler({
      ...configurationEntry,
      options: { dropIfConnectorDisabled: true, ...options }
    }),
    errorHandler: errorHandler(options)
  });
}

module.exports = incomingRequestHandlerFactory;
