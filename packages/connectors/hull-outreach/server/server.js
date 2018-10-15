// @flow
import type { $Application } from "express";

const cors = require("cors");
const { notificationHandler } = require("hull/lib/handlers");
const { credsFromQueryMiddlewares } = require("hull/lib/utils");

const notificationsConfiguration = require("./notifications-configuration");

const actions = require("./actions");

function server(app: $Application, deps: Object): $Application {
  // I couldn't get the (route, cors(), function) syntaxt to work, but this worked...
  app.post("/smart-notifier", notificationHandler(notificationsConfiguration));

  app.post("/fetch", ...credsFromQueryMiddlewares(), actions.fetchAction);

  app.get(
    "/fields-outreach-prospect-out",
    ...credsFromQueryMiddlewares(),
    cors(),
    actions.fieldsOutreachProspectOutbound
  );
  app.get(
    "/fields-outreach-prospect-in",
    ...credsFromQueryMiddlewares(),
    cors(),
    actions.fieldsOutreachProspectInbound
  );
  app.get(
    "/fields-outreach-account-in",
    ...credsFromQueryMiddlewares(),
    cors(),
    actions.fieldsOutreachAccountInbound
  );
  app.get(
    "/fields-outreach-account-out",
    ...credsFromQueryMiddlewares(),
    cors(),
    actions.fieldsOutreachAccountOutbound
  );
  app.get("/fields-hull-account-ident", cors(), actions.fieldsHullAccountIdent);
  app.get(
    "/fields-outreach-account-ident",
    ...credsFromQueryMiddlewares(),
    cors(),
    actions.fieldsOutreachAccountIdent
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
