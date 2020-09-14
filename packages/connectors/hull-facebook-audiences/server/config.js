// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

const triggerExtractAction = require("./handlers/trigger-extract");

export default function connectorConfig(): HullConnectorConfig {
  const {
    LOG_LEVEL,
    SECRET,
    PORT = 8082,
    NODE_ENV,
    OVERRIDE_FIREHOSE_URL,
    SHIP_CACHE_TTL,
    CACHE_REDIS_URL
  } = process.env;
  const hostSecret = SECRET || "1234";
  return {
    manifest,
    hostSecret,
    devMode: NODE_ENV === "development",
    port: PORT || 8082,
    handlers: handlers(),
    // middlewares: [fetchToken],
    cacheConfig: {
      store: "redis",
      url: CACHE_REDIS_URL,
      ttl: SHIP_CACHE_TTL || 180
    },
    logsConfig: {
      logLevel: LOG_LEVEL
    },
    clientConfig: {
      firehoseUrl: OVERRIDE_FIREHOSE_URL
    },
    serverConfig: {
      start: true
    },
    rawCustomRoutes: [
      {
        url: "/trigger-extract",
        handler: triggerExtractAction,
        method: "post"
      }
    ]
  };
}
