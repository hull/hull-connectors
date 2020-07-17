// @flow

import type { HullConnectorConfig } from "hull";
import { entryModel } from "hull-vm";
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
    KUE_PREFIX = "hull-phantombuster",
    QUEUE_NAME = "queueApp",
    SHIP_CACHE_TTL = 60,
    SHIP_CACHE_MAX = 100,
    MONGO_URL,
    MONGO_COLLECTION_NAME = "phantombuster_requests"
  } = process.env;

  if (!MONGO_COLLECTION_NAME || !MONGO_URL) {
    throw new Error("One or more MongoDB Environment variables not set.");
  }

  const startServer = COMBINED === "true" || SERVER === "true";
  const startWorker = COMBINED === "true" || WORKER === "true";
  const hostSecret = SECRET || "1234";

  // Mongo connection setup
  const EntryModel = entryModel({
    mongoUrl: MONGO_URL,
    collectionName: MONGO_COLLECTION_NAME
  });

  const cacheConfig = REDIS_URL
    ? { store: "redis", url: REDIS_URL }
    : { store: "memory" };

  if (REDIS_URL && !KUE_PREFIX) {
    throw new Error("Missing KUE_PREFIX to define queue name");
  }
  const queueConfig = REDIS_URL
    ? {
        store: "redis",
        url: REDIS_URL,
        name: KUE_PREFIX
      }
    : { store: "memory" };

  console.log({ REDIS_URL, KUE_PREFIX, cacheConfig, queueConfig });
  return {
    manifest,
    hostSecret,
    devMode: NODE_ENV === "development",
    port: PORT || 8082,
    handlers: handlers({ EntryModel }),
    middlewares: [],
    timeout: 25000,
    serverConfig: {
      start: startServer
    },
    workerConfig: {
      start: startWorker,
      queueName: QUEUE_NAME || "queue"
    },
    logsConfig: {
      logLevel: LOG_LEVEL
    },
    httpClientConfig: {
      prefix: "https://api.phantombuster.com/api/v2"
    },
    clientConfig: {
      firehoseUrl: OVERRIDE_FIREHOSE_URL
    },
    cacheConfig: {
      ...cacheConfig,
      ttl: SHIP_CACHE_TTL || 60,
      max: SHIP_CACHE_MAX || 100
    },
    queueConfig
  };
}
