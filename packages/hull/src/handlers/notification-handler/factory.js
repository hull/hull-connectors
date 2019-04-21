// @flow
import type { HullNotificationHandlerConfiguration } from "hull";
import type { Router } from "express";
import getRouter from "../get-router";

// Ensures ship:update notifications don't rely on the Ship Cache.
// @TODO do we still need this if we rely on the payload's data to hydrate the settings ?
// Can we update the cache on every notification ? Would it be beneficial ?
const { clearConnectorCache } = require("../../middlewares");

const processingMiddleware = require("./processing-middleware");
const errorMiddleware = require("./error-middleware");

/**
 * [notificationHandlerFactory description]
 * @param  {HullNotificationHandlerConfiguration} configuration: HullNotificationHandlerConfiguration [description]
 * @return {[type]}                [description]
 * @example
 * app.use('/smart-notification', notificationHandler({
 *   "user:update": (ctx, message) => {}
 * }));
 */
function notificationHandlerFactory(
  configuration: HullNotificationHandlerConfiguration
): Router {
  return getRouter({
    requestName: "notification",
    handlerName: "",
    handler: processingMiddleware(configuration),
    errorHandler: errorMiddleware(),
    beforeMiddlewares: [clearConnectorCache],
    options: {
      credentialsFromNotification: true,
      credentialsFromQuery: false,
      respondWithError: true,
      strict: true
    }
  });
}

module.exports = notificationHandlerFactory;
