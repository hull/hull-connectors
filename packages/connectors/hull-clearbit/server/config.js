// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const {
    PORT = "8082",
    LOG_LEVEL,
    NODE_ENV,
    SECRET = "1234",
    OVERRIDE_FIREHOSE_URL,
    FLOW_CONTROL_IN = 1,
    FLOW_CONTROL_SIZE = 200
  } = process.env;

  // We're not using default assignments because "null" values makes Flow choke
  const hostSecret = SECRET || "1234";
  return {
    manifest,
    hostSecret,
    devMode: NODE_ENV === "development",
    port: PORT || 8082,
    logLevel: LOG_LEVEL,
    middlewares: [],
    handlers: handlers({
      flow_size: FLOW_CONTROL_SIZE || 200,
      flow_in: FLOW_CONTROL_IN || 1
    }),
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
}
