// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";

const {
  LOG_LEVEL,
  PORT,
  SECRET,
  NODE_ENV,
  OVERRIDE_FIREHOSE_URL
} = process.env;

const connectorConfig: HullConnectorConfig = {
  manifest,
  devMode: NODE_ENV === "development",
  logLevel: LOG_LEVEL,
  hostSecret: SECRET || "1234",
  port: PORT || 8082,
  handlers: {},
  middlewares: [],
  clientConfig: {
    firehoseUrl: OVERRIDE_FIREHOSE_URL
  }
};

export default connectorConfig;
