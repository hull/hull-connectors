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
    OVERRIDE_FIREHOSE_URL
  } = process.env;

  // We're not using default assignments because "null" values makes Flow choke
  const hostSecret = SECRET || "1234";
  const port = PORT || "8082";
  const devMode = NODE_ENV === "development";
  return {
    manifest,
    devMode,
    logLevel: LOG_LEVEL,
    hostSecret,
    port,
    middlewares: [],
    handlers: handlers(),
    clientConfig: {
      firehoseUrl: OVERRIDE_FIREHOSE_URL
    }
  };
}
