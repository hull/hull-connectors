// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const {
    LOG_LEVEL,
    SECRET,
    NODE_ENV,
    PORT = 8082,
    OVERRIDE_FIREHOSE_URL,
    REDIS_URL,
    SHIP_CACHE_TTL = 60,
    SHIP_CACHE_MAX = 100
  } = process.env;

  const hostSecret = SECRET || "1234";

  const cacheConfig =
    REDIS_URL !== undefined
      ? {
          store: "redis",
          url: REDIS_URL
        }
      : { store: "memory" };
  return {
    manifest,
    hostSecret,
    devMode: NODE_ENV === "development",
    port: PORT || 8082,
    timeout: "25s",
    handlers,
    middlewares: [],
    cacheConfig: {
      ...cacheConfig,
      ttl: SHIP_CACHE_TTL || 60,
      max: SHIP_CACHE_MAX || 100
    },
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
