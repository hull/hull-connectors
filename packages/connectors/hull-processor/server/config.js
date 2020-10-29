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
    FLOW_CONTROL_IN,
    FLOW_CONTROL_SIZE
  } = process.env;

  const hostSecret = SECRET || "1234";

  const cacheConfig =
    REDIS_URL !== undefined
      ? { store: "redis", url: REDIS_URL }
      : { store: "memory" };
  return {
    manifest,
    hostSecret,
    devMode: NODE_ENV === "development",
    port: PORT || 8082,
    timeout: "25s",
    handlers: handlers({
      flow_size: parseInt(FLOW_CONTROL_SIZE, 10) || 200,
      flow_in: parseInt(FLOW_CONTROL_IN, 10) || 1
    }),
    middlewares: [],
    cacheConfig: {
      ...cacheConfig,
      ttl: parseInt(SHIP_CACHE_TTL, 10) || 60
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
