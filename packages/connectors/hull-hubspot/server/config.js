// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";
import hubspotWebhookHandler from "./handlers/hubspot-webhook-handler";

export default function connectorConfig(): HullConnectorConfig {
  const {
    LOG_LEVEL,
    SECRET,
    PORT = 8082,
    NODE_ENV,
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

  const hostSecret = SECRET || "1234";
  return {
    manifest,
    hostSecret,
    middlewares: [],
    handlers: handlers({
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET
    }),
    devMode: NODE_ENV === "development",
    port: PORT || 8082,
    cacheConfig: CACHE_REDIS_URL
      ? {
          store: "redis",
          url: CACHE_REDIS_URL,
          ttl: SHIP_CACHE_TTL || 180,
          max: CACHE_REDIS_MAX_CONNECTIONS || 5,
          min: CACHE_REDIS_MIN_CONNECTIONS || 1
        }
      : undefined,
    logsConfig: {
      logLevel: LOG_LEVEL
    },
    clientConfig: {
      firehoseUrl: OVERRIDE_FIREHOSE_URL,
      cachedCredentials: {
        serviceKey: "body[0].portalId"
      }
    },
    rawCustomRoutes: [
      {
        url: "/hubspot-webhook",
        handler: hubspotWebhookHandler,
        method: "post"
      }
    ]
  };
}
