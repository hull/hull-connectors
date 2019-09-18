import bodyParser from "body-parser";
import express from "express";
import { errorHandler } from "hull-connector";
import {
  webhookHandler,
  prospectHandler,
  statusHandler,
  batchHandler,
  notifyHandler
} from "./handlers";

function extractToken(req, res, next) {
  req.hull = req.hull || {};
  const token = req.query.id;
  req.hull.token = token;
  return next();
}

export default function Server(options = {}) {
  const app = express();
  const { Hull } = options;

  app.use(extractToken);

  const connector = new Hull.Connector(options);

  if (options.devMode) {
    const { devMode } = require("hull-connector"); // eslint-disable-line global-require
    devMode(app, options);
  }
  connector.setupApp(app);

  app.post("/smart-notifier", notifyHandler(options));
  app.post("/batch", batchHandler(options));
  app.all("/status", statusHandler);

  // Error Handler
  app.use(errorHandler);
  return connector.startApp(app);
}
