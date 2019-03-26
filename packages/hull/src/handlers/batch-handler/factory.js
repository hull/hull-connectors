// @flow
import type { HullBatchHandlersConfiguration } from "../../types";
import getRouter from "../get-router";

const processingMiddleware = require("./processing-middleware");
const errorMiddleware = require("./error-middleware");

/**
 * [notificationHandlerFactory description]
 * @param  {HullNotificationHandlerConfiguration} configuration: HullNotificationHandlerConfiguration [description]
 * @return {[type]}                [description]
 * @example
 * app.use("/batch", notificationHandler({
 *   "user:update": (ctx, message) => {}
 * }));
 */
function batchExtractHandlerFactory(
  configuration: HullBatchHandlersConfiguration
): * {
  return getRouter({
    requestName: "batch",
    handlerName: "batch",
    handler: processingMiddleware(configuration),
    errorHandler: errorMiddleware,
    options: {
      credentialsFromNotification: true,
      credentialsFromQuery: true,
      strict: false
    }
  });
}

module.exports = batchExtractHandlerFactory;
