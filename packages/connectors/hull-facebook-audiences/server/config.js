// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const {
    CLIENT_ID,
    CLIENT_SECRET,
    LOG_LEVEL,
    SECRET,
    PORT = 8082,
    NODE_ENV,
    OVERRIDE_FIREHOSE_URL,
    SHIP_CACHE_TTL,
    REDIS_URL,
    REDIS_MAX_CONNECTIONS = 5,
    REDIS_MIN_CONNECTIONS = 1
  } = process.env;
  const hostSecret = SECRET || "1234";
  return {
    manifest,
    hostSecret,
    devMode: NODE_ENV === "development",
    port: PORT || 8082,
    handlers: handlers({
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET
    }),
    cacheConfig: REDIS_URL
      ? {
          store: "redis",
          url: REDIS_URL,
          ttl: SHIP_CACHE_TTL || 180,
          max: REDIS_MAX_CONNECTIONS || 5,
          min: REDIS_MIN_CONNECTIONS || 1
        }
      : undefined,
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
