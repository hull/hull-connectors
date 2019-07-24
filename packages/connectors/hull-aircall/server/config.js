// @flow

import type { HullConnectorConfig } from "hull";
import _ from "lodash";
import manifest from "../manifest.json";
import fetchToken from "./lib/fetch-token";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const {
    LOG_LEVEL,
    SECRET,
    NODE_ENV,
    PORT = 8082,
    OVERRIDE_FIREHOSE_URL
  } = process.env;

  const hostSecret = SECRET || "1234";

  return {
    manifest,
    hostSecret,
    devMode: NODE_ENV === "development",
    port: PORT || 8082,
    handlers: handlers(),
    middlewares: [fetchToken],
    cacheConfig: {
      store: "memory",
      ttl: 1
    },
    logsConfig: {
      logLevel: LOG_LEVEL
    },
    clientConfig: {
      firehoseUrl: OVERRIDE_FIREHOSE_URL,
      connectorName: _.kebabCase(manifest.name)
    },
    serverConfig: {
      start: true
    }
  };
}
