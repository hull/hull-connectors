// @flow
import type { $Application } from "express";
const cors = require("cors");

const {
  notificationHandler,
  jsonHandler,
  scheduleHandler
} = require("hull/src/handlers");

const notificationsConfiguration = require("./notifications-configuration");

const actions = require("./actions");

function server(app: $Application, deps: Object): $Application {
  // I couldn't get the (route, cors(), function) syntaxt to work, but this worked...
  app.post("/smart-notifier", notificationHandler(notificationsConfiguration));

  app.post("/fetch", scheduleHandler(actions.fetchAction));

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

  app.get("/admin", actions.adminHandler);

  // app.all("/webhook", bodyParser.json(), webhookHandler);

  app.all("/status", scheduleHandler(actions.statusCheck));

  // app.use(
  //   "/batch",
  //   smartNotifierHandler({
  //     userHandlerOptions: {
  //       groupTraits: false
  //     },
  //     handlers: notificationsConfiguration
  //   })
  // );

  app.use("/auth", actions.oauth(deps));
}

module.exports = server;
