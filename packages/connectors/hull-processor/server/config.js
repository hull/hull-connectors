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
    MEMCACHEDCLOUD_SERVERS,
    MEMCACHEDCLOUD_USERNAME,
    MEMCACHEDCLOUD_PASSWORD,
    SHIP_CACHE_TTL = 60,
    FLOW_CONTROL_IN,
    FLOW_CONTROL_SIZE
  } = process.env;

  const hostSecret = SECRET || "1234";

  const cacheConfig =
    // eslint-disable-next-line no-nested-ternary
    MEMCACHEDCLOUD_SERVERS && MEMCACHEDCLOUD_PASSWORD && MEMCACHEDCLOUD_USERNAME
      ? {
          store: "memcached",
          hosts: MEMCACHEDCLOUD_SERVERS,
          username: MEMCACHEDCLOUD_USERNAME,
          password: MEMCACHEDCLOUD_PASSWORD
        }
      : REDIS_URL !== undefined
      ? { store: "redis", url: REDIS_URL }
      : { store: "memory" };
  return {
    manifest,
    hostSecret,
    devMode: NODE_ENV === "development",
    port: PORT || 8082,
    timeout: "25s",
    handlers: handlers({
      flow_size: FLOW_CONTROL_SIZE || 200,
      flow_in: FLOW_CONTROL_IN || 1
    }),
    middlewares: [],
    cacheConfig: {
      ...cacheConfig,
      ttl: SHIP_CACHE_TTL || 60
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
