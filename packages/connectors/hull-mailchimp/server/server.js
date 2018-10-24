/* @flow */
import type { $Application } from "express";

const bodyParser = require("body-parser");
const {
  notificationHandler,
  scheduleHandler,
  jsonHandler,
  incomingRequestHandler
} = require("hull/src/handlers");
const { credentialsFromQueryMiddleware } = require("hull/src/middlewares");

const oauth = require("./lib/oauth-client");
const actions = require("./actions");
const notifHandlers = require("./notif-handlers");

function server(app: $Application): $Application {
  const shipConfig = {
    hostSecret: process.env.SECRET,
    clientID: process.env.MAILCHIMP_CLIENT_ID,
    clientSecret: process.env.MAILCHIMP_CLIENT_SECRET
  };

  app.use(
    "/auth",
    oauth({
      name: "Mailchimp",
      clientID: shipConfig.clientID,
      clientSecret: shipConfig.clientSecret,
      callbackUrl: "/callback",
      homeUrl: "/",
      selectUrl: "/select",
      syncUrl: "/sync",
      site: "https://login.mailchimp.com",
      tokenPath: "/oauth2/token",
      authorizationPath: "/oauth2/authorize",
      hostSecret: shipConfig.hostSecret
    })
  );

  app.use(
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

  app.use(
    "/smart-notifier",
    notificationHandler({
      "segment:update": notifHandlers.segmentUpdate,
      "segment:delete": notifHandlers.segmentDelete,
      "user:update": notifHandlers.userUpdate,
      "ship:update": notifHandlers.shipUpdate
    })
  );

  app.use("/sync", scheduleHandler(actions.sync));

  app.use("/sync-in", jsonHandler(actions.syncIn));

  app.use("/sync-out", jsonHandler(actions.syncOut));

  app.use("/track", scheduleHandler(actions.track));

  app.use(
    "/mailchimp",
    bodyParser.urlencoded({ extended: true }),
    credentialsFromQueryMiddleware(),
    incomingRequestHandler(actions.webhook)
  );

  app.use("/schema/user_fields", jsonHandler(actions.schemaUserFields));

  app.use("/status", scheduleHandler(actions.status));

  return app;
}

module.exports = server;
