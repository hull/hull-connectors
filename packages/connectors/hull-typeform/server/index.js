/* @flow */

import Hull from "hull";
import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import routes from "./routes";

const { Cache } = require("hull/src/infra");

const {
  SECRET,
  NODE_ENV,
  OVERRIDE_FIREHOSE_URL,
  LOG_LEVEL,
  PORT
} = process.env;

const connectorConfig: HullConnectorConfig = {
  manifest,
  devMode: NODE_ENV === "development",
  logLevel: LOG_LEVEL,
  hostSecret: SECRET || "1234",
  port: PORT || 8082,
  handlers: {},
  middlewares: [],
  logsConfig: {
    logLevel: LOG_LEVEL
  },
  clientConfig: {
    firehoseUrl: OVERRIDE_FIREHOSE_URL
  },
  serverConfig: {
    start: true
  },
  cache: new Cache({
    store: "memory",
    isCacheableValue: () => false
  })
};

const connector = new Hull.Connector(connectorConfig);
routes(connector);
connector.start();
