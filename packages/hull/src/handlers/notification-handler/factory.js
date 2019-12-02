// @flow
import type { HullRouteMap, HullNotificationHandlerConfiguration } from "hull";
import getRouter from "../get-router";

// Ensures ship:update notifications don't rely on the Ship Cache.
// Updating cache on every payload removes need for this ?
// const { clearConnectorCache } = require("../../middlewares");

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
): HullRouteMap {
  return getRouter({
    requestName: "notification",
    handlerName: "",
    handler: processingMiddleware(configuration),
    errorHandler: errorMiddleware(),
    afterMiddlewares: [],
    options: {
      credentialsFromNotification: true,
      credentialsFromQuery: false,
      respondWithError: true,
      strict: true
    }
  });
}

module.exports = notificationHandlerFactory;
