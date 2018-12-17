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
    // eslint-disable-next-line global-require
    const webpackDevMode = require("./dev-mode");
    webpackDevMode(app, {
      port,
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

  // Error Handler
  app.use(errorHandler);
  const server = connector.startApp(app);
  console.log(`Started server on port ${port}`);
  return { connector, app, server };
}
