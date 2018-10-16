// @flow
import type { $Application } from "express";

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
    jsonHandler(actions.fieldsOutreachProspectOutbound)
  );
  app.get(
    "/fields-outreach-prospect-in",
    jsonHandler(actions.fieldsOutreachProspectInbound)
  );
  app.get(
    "/fields-outreach-account-in",
    jsonHandler(actions.fieldsOutreachAccountInbound)
  );
  app.get(
    "/fields-outreach-account-out",
    jsonHandler(actions.fieldsOutreachAccountOutbound)
  );
  app.get(
    "/fields-hull-account-ident",
    jsonHandler(actions.fieldsHullAccountIdent)
  );
  app.get(
    "/fields-outreach-account-ident",
    jsonHandler(actions.fieldsOutreachAccountIdent)
  );

  app.get("/admin", actions.adminHandler);

  // app.all("/webhook", bodyParser.json(), webhookHandler);
  // app.all("/status", statusCheck);

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
