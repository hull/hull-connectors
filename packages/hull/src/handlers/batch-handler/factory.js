// @flow
import type { HullBatchHandlersConfiguration } from "../../types";
import getRouter from "../get-router";

const processingMiddleware = require("./processing-middleware");
const errorMiddleware = require("./error-middleware");

/**
 * [notificationHandlerFactory description]
 * @param  {HullBatchHandlersConfiguration} configuration: HullBatchHandlersConfiguration [description]
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
    options: {
      credentialsFromNotification: false,
      credentialsFromQuery: true,
      strict: false
    },
    requestName: "batch",
    handlerName: "batch",
    handler: processingMiddleware(configuration),
    errorHandler: errorMiddleware
  });
}

module.exports = batchExtractHandlerFactory;
