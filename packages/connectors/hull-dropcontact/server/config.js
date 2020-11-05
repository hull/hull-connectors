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
    COMBINED,
    SERVER,
    WORKER,
    OVERRIDE_FIREHOSE_URL,
    REDIS_URL,
    KUE_PREFIX = "hull-dropcontact",
    QUEUE_NAME = "queueApp"
  } = process.env;

  if (NODE_ENV === "production" && !REDIS_URL) {
    throw new Error("This connector requires Redis to work");
  }

  const hostSecret = SECRET || "1234";

  const cacheConfig =
    REDIS_URL !== undefined
      ? {
          store: "redis",
          url: REDIS_URL
        }
      : { store: "memory" };

  if (REDIS_URL && !KUE_PREFIX) {
    throw new Error("Missing KUE_PREFIX to define queue name");
  }

  return {
    manifest,
    hostSecret,
    devMode: NODE_ENV === "development",
    port: PORT || 8082,
    handlers: handlers({ flow_in: 1, flow_size: 250, flow_in_time: 10000 }),
    middlewares: [],
    timeout: 25000,
    serverConfig: {
      start: COMBINED === "true" || SERVER === "true"
    },
    workerConfig: {
      start: COMBINED === "true" || WORKER === "true",
      queueName: QUEUE_NAME || "queue"
    },
    logsConfig: {
      logLevel: LOG_LEVEL
    },
    clientConfig: {
      firehoseUrl: OVERRIDE_FIREHOSE_URL
    },
    cacheConfig,
    queueConfig: REDIS_URL
      ? {
          store: "redis",
          url: REDIS_URL,
          name: KUE_PREFIX
        }
      : { store: "memory" }
  };
}
