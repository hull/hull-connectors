/* @flow */
import type { $Application } from "express";

import type {
  HullContext,
  HullUserUpdateMessage,
  HullAccountUpdateMessage,
  HullRequest
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

const { HullRouter } = require("./shared/router");
const actions = require("./actions");

const hullRouter: HullRouter = new HullRouter();

function server(app: $Application, deps: Object): $Application {

  const authHandler = hullRouter.createAuthHandler();
  if (authHandler !== null) {
    app.use("/auth", authHandler);
  }

  /**
   * We should think more about how the rules get hooked into routes
   * would be cool if this could happen automatically depending on the endpoints you've implemented
   * it's an abstraction for automically routing messages depending on what they "mean"
   */
  const notifications = {
    "user:update": (ctx: HullContext, messages: Array<HullUserUpdateMessage>) => {
      return hullRouter.outgoingData("user", ctx, messages);
      },
    "account:update": (ctx: HullContext, messages: Array<HullAccountUpdateMessage>) => {
      return hullRouter.outgoingData("account", ctx, messages);
    }
  };

  app.use(
    "/webhooks",
    incomingRequestHandler({
      callback: (context: HullContext, webhookPayload: any) => {
        return hullRouter.incomingData("webhook", context, webhookPayload);
      },
      options: {
        parseCredentialsFromQuery: true,
        bodyParser: "json"
      }
    })
  );

  app.post("/fetch", jsonHandler({
    callback: (req: HullRequest): Promise<any> => {
      return hullRouter.incomingRequest("fetchAll", req);
    },
    options: {
      fireAndForget: true
    }
  }));
  app.post("/accountFetchAll", jsonHandler({
    callback: (req: HullRequest): Promise<any> => {
      return hullRouter.incomingRequest("accountFetchAll", req);
    },
    options: {
      fireAndForget: true
    }
  }));
  app.post("/prospectFetchAll", jsonHandler({
    callback: (req: HullRequest): Promise<any> => {
      return hullRouter.incomingRequest("prospectFetchAll", req);
    },
    options: {
      fireAndForget: true
    }
  }));

  app.post("/smart-notifier", notificationHandler(notifications));
  app.post("/batch", batchHandler(notifications));
  app.post("/batch-accounts", batchHandler(notifications));

  app.post("/status", scheduleHandler(
    (req: HullRequest): Promise<any> => {
      return hullRouter.status(req);
      }));

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
}

module.exports = server;
