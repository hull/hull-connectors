// @flow

import express from "express";
import errorHandler from "./error";
import type { HullConnectorConfig } from "../types";
import HullType from "../hull";

export default function Server({
  Hull,
  connectorConfig
}: {
  Hull: typeof HullType,
  connectorConfig: HullConnectorConfig
}) {
  const { port, devMode, hostSecret, clientConfig } = connectorConfig;
  const app = express();

  if (devMode) {
    const { devMode: webpackDevMode } = require("./dev-mode");
    webpackDevMode(app, {
      source: "../src",
      destination: "../dist"
    });
  }

  // Setup Hull express connector;
  const connector = new Hull.Connector({
    hostSecret,
    port,
    clientConfig
  });
  connector.setupApp(app);

  // const hullMiddleware = Hull.Middleware({ hostSecret, fetchShip: true });
  //
  // app.use(hullMiddleware);
  // Error Handler
  app.use(errorHandler);
  connector.startApp(app);
  console.log(`Started server on port ${port}`);
  return app;
}
