// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";
import authMiddleware from "./lib/segment-auth-middleware";

export default function connectorConfig(): HullConnectorConfig {
  const {
    PORT = 8082,
    LOG_LEVEL,
    NODE_ENV,
    SECRET = "1234",
    FLOW_CONTROL_IN,
    FLOW_CONTROL_SIZE,
    OVERRIDE_FIREHOSE_URL,
    REDIS_URL = "",
    SHIP_CACHE_TTL = 60
  } = process.env;

  const hostSecret = SECRET || "1234";

  return {
    manifest,
    hostSecret,
    devMode: NODE_ENV === "development",
    logLevel: LOG_LEVEL,
    port: PORT || 8082,
    handlers: handlers({
      flow_size: FLOW_CONTROL_SIZE || 100,
      flow_in: FLOW_CONTROL_IN || 10
    }),
    middlewares: [authMiddleware],
    clientConfig: {
      firehoseUrl: OVERRIDE_FIREHOSE_URL
    },
    cache: REDIS_URL && {
      store: "redis",
      url: REDIS_URL,
      ttl: SHIP_CACHE_TTL
    }
  };
}
