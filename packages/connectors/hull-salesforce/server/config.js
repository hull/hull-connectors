// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const {
    SHIP_CACHE_TTL = 180,
    OVERRIDE_FIREHOSE_URL,
    CACHE_REDIS_URL,
    CACHE_REDIS_MAX_CONNECTIONS = 5,
    CACHE_REDIS_MIN_CONNECTIONS = 1,
    CLIENT_ID,
    CLIENT_SECRET
  } = process.env;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("CLIENT_ID or CLIENT_SECRET variables missing");
  }

  return {
    manifest,
    middlewares: [],
    handlers: handlers({
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET
    }),
    cacheConfig: CACHE_REDIS_URL
      ? {
          store: "redis",
          url: CACHE_REDIS_URL,
          ttl: SHIP_CACHE_TTL || 180,
          max: CACHE_REDIS_MAX_CONNECTIONS || 5,
          min: CACHE_REDIS_MIN_CONNECTIONS || 1
        }
      : undefined,
    clientConfig: {
      firehoseUrl: OVERRIDE_FIREHOSE_URL,
      timeout: 20000
    }
  };
}
