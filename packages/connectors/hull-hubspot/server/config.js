// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

const redisStore = require("cache-manager-redis");
const { Cache } = require("hull/src/infra");

const {
  LOG_LEVEL,
  SECRET,
  SHIP_CACHE_TTL = 180,
  PORT = 8082,
  NODE_ENV,
  CACHE_REDIS_URL,
  CACHE_REDIS_MAX_CONNECTIONS = 5,
  CACHE_REDIS_MIN_CONNECTIONS = 1,
  OVERRIDE_FIREHOSE_URL,
  CLIENT_ID,
  CLIENT_SECRET
} = process.env;

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error("some environment variables missing");
}

const hostSecret = SECRET || "1234";
const connectorConfig: HullConnectorConfig = {
  manifest,
  hostSecret,
  middlewares: [],
  handlers: handlers({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET
  }),
  devMode: NODE_ENV === "development",
  port: PORT || 8082,
  cache: CACHE_REDIS_URL
    ? new Cache({
        store: redisStore,
        url: CACHE_REDIS_URL,
        ttl: SHIP_CACHE_TTL,
        max: CACHE_REDIS_MAX_CONNECTIONS,
        min: CACHE_REDIS_MIN_CONNECTIONS
      })
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

export default connectorConfig;
