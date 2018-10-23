/* @flow */
const { Router } = require("express");
const bodyParser = require("body-parser");
const {
  notificationHandler,
  scheduleHandler,
  jsonHandler,
  incomingRequestHandler
} = require("hull/src/handlers");

const { credentialsFromQueryMiddleware } = require("hull/src/middlewares");

const actions = require("../actions");
const notifHandlers = require("../notif-handlers");

function appRouter() {
  const router = new Router();

  router.use(
    "/batch",
    notificationHandler({
      "user:update": {
        callback: notifHandlers.batch,
        options: {
          maxSize: 500
        }
      }
    })
  );

  router.use(
    "/smart-notifier",
    notificationHandler({
      "segment:update": notifHandlers.segmentUpdate,
      "segment:delete": notifHandlers.segmentDelete,
      "user:update": notifHandlers.userUpdate,
      "ship:update": notifHandlers.shipUpdate
    })
  );

  router.use("/sync", scheduleHandler(actions.sync));

  router.use("/sync-in", jsonHandler(actions.syncIn));

  router.use("/sync-out", jsonHandler(actions.syncOut));

  router.use("/track", scheduleHandler(actions.track));

  router.use(
    "/mailchimp",
    bodyParser.urlencoded({ extended: true }),
    credentialsFromQueryMiddleware(),
    incomingRequestHandler(actions.webhook)
  );

  router.use("/schema/user_fields", jsonHandler(actions.schemaUserFields));

  router.use("/status", scheduleHandler(actions.status));

  return router;
}

module.exports = appRouter;
