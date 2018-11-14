/* @flow */
import type { $Application } from "express";

import type {
  HullContext,
  HullUserUpdateMessage,
  HullAccountUpdateMessage
} from "hull";

const cors = require("cors");
const bodyParser = require("body-parser");

const _ = require("lodash");

const {
  notificationHandler,
  jsonHandler,
  scheduleHandler,
  batchHandler,
  incomingRequestHandler,
  htmlHandler
} = require("hull/src/handlers");


const actions = require("./actions");

const { HullConnectorEngine } = require("./shared/engine");


const { glue } = require("./glue");

const { service } = require("./service");
const { transformsToService } = require("./transforms-to-service");

const { hullService } = require("./shared/hull-service");
const { transformsToHull } = require("./transforms-to-hull");



function server(app: $Application, deps: Object): $Application {

  const engine: HullConnectorEngine = new HullConnectorEngine(
    glue,
    {hull: hullService, outreach: service},
    _.concat(transformsToHull, transformsToService),
    "ensureWebhooks");


/**
 * We should think more about how the rules get hooked into routes
 * would be cool if this could happen automatically depending on the endpoints you've implemented
 * it's an abstraction for automically routing messages depending on what they "mean"
 */
  const notifications = {
    "user:update": (ctx: HullContext, messages: Array<HullUserUpdateMessage>) => {
      return engine.userUpdate(ctx, messages);
      },
    "account:update": (ctx: HullContext, messages: Array<HullAccountUpdateMessage>) => {
      return engine.accountUpdate(ctx, messages);
    }
  };

  app.post("/smart-notifier", notificationHandler(notifications));
  app.post("/batch", batchHandler(notifications));

  const authCallback = engine.getAuthCallback();
  if (authCallback !== null) {
    app.use("/auth", authCallback);
  }

  app.post("/status", scheduleHandler(engine.getStatusCallback()));

  const fetchAllAction = engine.getFetchAllAction();
  if (fetchAllAction !== null)
    app.post("/fetch", jsonHandler(fetchAllAction));

  const webhookCallback = engine.getWebhookCallback();
  if (webhookCallback !== null) {
    app.use(
      "/webhooks",
      incomingRequestHandler({
        callback: webhookCallback,
        options: {
          parseCredentialsFromQuery: true,
          bodyParser: "json"
        }
      })
    );
  }


  app.get("/admin", htmlHandler(actions.adminHandler));
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
