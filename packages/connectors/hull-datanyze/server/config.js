// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

const { Queue } = require("hull/src/infra");
const KueAdapter = require("hull/src/infra/queue/adapter/kue");

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
  const startServer = COMBINED === "true" || SERVER === "true";
  const startWorker = COMBINED === "true" || WORKER === "true";
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
      start: startServer
    },
    workerConfig: {
      start: startWorker,
      queueName: QUEUE_NAME || "queue"
    },
    queue: new Queue(
      new KueAdapter({
        prefix: KUE_PREFIX,
        redis: REDIS_URL
      })
    )
  };
}
