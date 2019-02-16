// @flow
import type { HullFramework, Connector } from "hull";

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

type RoutesOptions = {
  redisUri?: string | null,
  startServer: boolean,
  startWorker: boolean,
  clientID: string,
  clientSecret: string
};

export default function Routes(connector: Connector, options: RoutesOptions) {
  const { app, connectorConfig } = connector;
  const { hostSecret } = connectorConfig;
  const { clientID, clientSecret } = options;
  app.use(
    "/auth",
    oauth({
      hostSecret,
      name: "Mailchimp",
      clientID,
      clientSecret,
      callbackUrl: "/callback",
      homeUrl: "/",
      selectUrl: "/select",
      syncUrl: "/sync",
      site: "https://login.mailchimp.com",
      tokenPath: "/oauth2/token",
      authorizationPath: "/oauth2/authorize"
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

  app.use("/sync", jsonHandler(actions.sync));

  app.use("/sync-in", jsonHandler(actions.syncIn));

  app.use("/sync-out", jsonHandler(actions.syncOut));

  app.use("/track", scheduleHandler(actions.track));

  app.use(
    "/mailchimp",
    credentialsFromQueryMiddleware(),
    incomingRequestHandler({
      callback: actions.webhook,
      options: {
        bodyParser: "urlencoded"
      }
    })
  );

  app.use("/schema/user_fields", jsonHandler(actions.schemaUserFields));

  app.use("/status", scheduleHandler(actions.status));
}
