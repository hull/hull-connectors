// @flow
import type { HullNotificationHandlerConfiguration } from "hull";

const { Router } = require("express");
// const { normalizeHandlersConfiguration } = require("../../utils");
const {
  hullContextMiddleware,
  instrumentationTransientErrorMiddleware,
  clearConnectorCache
} = require("../../middlewares");

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
  const router = Router();
  // const normalizedConfiguration = normalizeHandlersConfiguration(configuration);

  router.use(
    hullContextMiddleware({
      requestName: "notification",
      type: "notification"
    })
  );
  router.use(clearConnectorCache);
  router.use(processingMiddleware(configuration));
  router.use(instrumentationTransientErrorMiddleware());
  router.use(errorMiddleware());
  return router;
}

module.exports = notificationHandlerFactory;
