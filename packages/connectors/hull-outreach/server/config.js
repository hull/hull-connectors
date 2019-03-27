// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

const {
  LOG_LEVEL,
  SECRET,
  PORT = 8082,
  NODE_ENV,
  OVERRIDE_FIREHOSE_URL
} = process.env;

const connectorConfig: HullConnectorConfig = {
  manifest,
  handlers,
  hostSecret: SECRET || "1234",
  devMode: NODE_ENV === "development",
  port: PORT || 8082,
  middlewares: [],
  logsConfig: {
    logLevel: LOG_LEVEL
  },
  clientConfig: {
    firehoseUrl: OVERRIDE_FIREHOSE_URL
  },
  serverConfig: {
    start: true
  }
};

export default connectorConfig;
