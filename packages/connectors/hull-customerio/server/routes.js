// @flow
import type { HullRequest, HullResponse, Connector } from "hull";
import { notificationHandler, batchHandler } from "hull/src/handlers";
import { middleware, encrypt } from "./lib/crypto";
import { webhookHandler, statusCheck, updateUser } from "./actions";

export default function Routes(connector: Connector) {
  const { app, connectorConfig /* Client, server */ } = connector;
  const { hostSecret } = connectorConfig;

  app.get("/admin.html", (req: HullRequest, res: HullResponse) => {
    const token = encrypt(req.hull.clientCredentials, hostSecret);
    res.render("admin.html", { hostname: req.hostname, token });
  });

  app.all("/webhook", middleware(hostSecret), webhookHandler);

  app.all("/status", statusCheck);

  app.use("/batch", batchHandler({ "user:update": { callback: updateUser } }));

  app.use(
    "/smart-notifier",
    notificationHandler({
      "user:update": {
        callback: updateUser
      }
    })
  );

  return app;
}
