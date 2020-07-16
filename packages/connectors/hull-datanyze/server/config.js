// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const {
    PORT = 8082,
    LOG_LEVEL,
    NODE_ENV,
    SECRET = "1234",
    KUE_PREFIX = "hull-datanyze",
    SHIP_CACHE_TTL,
    QUEUE_NAME = "queueApp",
    OVERRIDE_FIREHOSE_URL,
    REDIS_URL,
    REDIS_MAX_CONNECTIONS = 5,
    REDIS_MIN_CONNECTIONS = 1,
    COMBINED,
    SERVER,
    WORKER
  } = process.env;

  if (COMBINED !== "true" && WORKER !== "true" && SERVER !== "true") {
    throw new Error(
      "None of the processes were started, set any of COMBINED, SERVER or WORKER env vars"
    );
  }

  const hostSecret = SECRET || "1234";
  return {
    manifest,
    hostSecret,
    handlers,
    devMode: NODE_ENV === "development",
    port: PORT || 8082,
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
      start: COMBINED === "true" || SERVER === "true"
    },
    workerConfig: {
      start: COMBINED === "true" || WORKER === "true",
      queueName: QUEUE_NAME || "queue"
    },
    queueConfig: REDIS_URL
      ? {
          store: "redis",
          url: REDIS_URL,
          name: KUE_PREFIX
        }
      : { store: "memory" }
  };
}
