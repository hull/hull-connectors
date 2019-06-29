// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";

export default function connectorConfig(): HullConnectorConfig {
  const {
    LOG_LEVEL,
    PORT = 8082,
    SECRET = "1234",
    NODE_ENV,
    OVERRIDE_FIREHOSE_URL
  } = process.env;

  return {
    manifest,
    devMode: NODE_ENV === "development",
    logLevel: LOG_LEVEL,
    hostSecret: SECRET || "1234",
    port: PORT || "8082",
    handlers: {},
    middlewares: [],
    clientConfig: {
      firehoseUrl: OVERRIDE_FIREHOSE_URL
    }
  };
}
