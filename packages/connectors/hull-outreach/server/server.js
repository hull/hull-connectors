// @flow
import type { $Application } from "express";

const cors = require("cors");

const {
  notificationHandler,
  jsonHandler,
  scheduleHandler,
  batchHandler
} = require("hull/src/handlers");

const notificationsConfiguration = require("./notifications-configuration");

const actions = require("./actions");

function server(app: $Application, deps: Object): $Application {
  app.use("/auth", actions.oauth(deps));
  app.all("/checkToken", scheduleHandler(actions.tokenCheck));
  app.all("/status", scheduleHandler(actions.statusCheck));

  app.post("/smart-notifier", notificationHandler(notificationsConfiguration));
  app.post("/batch", batchHandler(notificationsConfiguration));
  app.post("/fetch", scheduleHandler(actions.fetchAction));
  // app.all("/webhook", bodyParser.json(), webhookHandler);

  app.get(
    "/fields-outreach-prospect-out",
    cors(),
    jsonHandler(actions.fieldsOutreachProspectOutbound)
  );
  app.get(
    "/fields-outreach-prospect-in",
    cors(),
    jsonHandler(actions.fieldsOutreachProspectInbound)
  );
  app.get(
    "/fields-outreach-account-in",
    cors(),
    jsonHandler(actions.fieldsOutreachAccountInbound)
  );
  app.get(
    "/fields-outreach-account-out",
    cors(),
    jsonHandler(actions.fieldsOutreachAccountOutbound)
  );
  app.get(
    "/fields-hull-account-ident",
    cors(),
    jsonHandler(actions.fieldsHullAccountIdent)
  );
  app.get(
    "/fields-outreach-account-ident",
    cors(),
    jsonHandler(actions.fieldsOutreachAccountIdent)
  );
}

module.exports = server;
