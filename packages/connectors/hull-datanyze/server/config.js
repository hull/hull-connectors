// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

const { Queue } = require("hull/src/infra");
const KueAdapter = require("hull/src/infra/queue/adapter/kue");

export default function connectorConfig(): HullConnectorConfig {
  const {
    REDIS_URL,
    KUE_PREFIX = "hull-datanyze",
    QUEUE_NAME = "queueApp",
    COMBINED,
    SERVER,
    WORKER
  } = process.env;

  if (COMBINED !== "true" && WORKER !== "true" && SERVER !== "true") {
    throw new Error(
      "None of the processes were started, set any of COMBINED, SERVER or WORKER env vars"
    );
  }

  const startServer = COMBINED === "true" || SERVER === "true";
  const startWorker = COMBINED === "true" || WORKER === "true";
  return {
    manifest,
    handlers,
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
