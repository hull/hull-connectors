/* @flow */
import type { $Application } from "express";

const { smartNotifierHandler } = require("hull/lib/utils");
const {
  statusCheckAction
} = require("./handlers");
const notificationsConfiguration = require("./notifications-configuration");

function server(app: $Application): $Application {
  app.all("/status", statusCheckAction);

  app.use("/smart-notifier", smartNotifierHandler({
    handlers: notificationsConfiguration
  }));

  app.post("/batch-accounts", smartNotifierHandler({
    handlers: notificationsConfiguration,
    options: {
      maxSize: 10
    }
  }));

  return app;
}

module.exports = server;
