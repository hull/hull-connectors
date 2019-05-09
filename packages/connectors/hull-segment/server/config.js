// @flow

import type { HullConnectorConfig } from "hull";
import redisStore from "cache-manager-redis";
import { Cache } from "hull/src/infra";
import manifest from "../manifest.json";
import handlers from "./handlers";
import authMiddleware from "./lib/segment-auth-middleware";

export default function connectorConfig(): HullConnectorConfig {
  const {
    PORT = 8082,
    LOG_LEVEL,
    NODE_ENV,
    SECRET = "1234",
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
    handlers: handlers(),
    middlewares: [authMiddleware],
    clientConfig: {
      firehoseUrl: OVERRIDE_FIREHOSE_URL
    },
    cache:
      REDIS_URL &&
      new Cache({
        store: redisStore,
        url: REDIS_URL,
        ttl: SHIP_CACHE_TTL
      })
  };
}
