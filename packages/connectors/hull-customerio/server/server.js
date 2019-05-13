/* @flow */
import type { $Application } from "express";
import type { HullRequest, HullUserUpdateMessage } from "hull";

const {
  notificationHandler,
  batchHandler,
  htmlHandler,
  scheduleHandler
} = require("hull/src/handlers");

const {
  fullContextFetchMiddleware,
  timeoutMiddleware,
  haltOnTimedoutMiddleware,
  clientMiddleware,
  instrumentationContextMiddleware
} = require("hull/src/middlewares");

const bodyParser = require("body-parser");

const { webhookHandler, statusCheck, updateUser } = require("./actions");
const { encrypt } = require("./lib/crypto");
const { middleware } = require("./lib/crypto");

function server(app: $Application): $Application {
  const deps = {
    hostSecret: process.env.SECRET || "1234"
  };

  app.get(
    "/admin.html",
    htmlHandler(ctx => {
      const token = encrypt(
        ctx.clientCredentials,
        ctx.connectorConfig.hostSecret
      );
      return Promise.resolve({
        pageLocation: "admin.html",
        data: { hostname: ctx.hostname, token }
      });
    })
  );

  // app.get("/admin.html", (req: HullRequest, res: $Response) => {
  //   const token = encrypt(req.hull.config, hostSecret);
  //   res.render("admin.html", { hostname: req.hostname, token });
  // });

  // app.all(
  //   "/webhook",
  //   bodyParser.json(),
  //   middleware(hostSecret),
  //   webhookHandler
  // );

  app.all(
    "/webhook",
    bodyParser.json(),
    middleware(deps.hostSecret),
    timeoutMiddleware(),
    clientMiddleware(),
    haltOnTimedoutMiddleware(),
    instrumentationContextMiddleware(),
    fullContextFetchMiddleware({ requestName: "action" }),
    haltOnTimedoutMiddleware(),
    webhookHandler
  );

  app.all("/status", scheduleHandler(statusCheck));

  app.use(
    "/batch",
    batchHandler({
      "user:update": updateUser
    })
  );

  app.use(
    "/smart-notifier",
    notificationHandler({
      "user:update": (
        ctx: HullRequest,
        messages: Array<HullUserUpdateMessage>
      ) => {
        return updateUser(ctx, messages);
      }
    })
  );

  return app;
}

module.exports = server;
