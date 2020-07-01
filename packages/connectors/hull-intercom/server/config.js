// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

const { Queue } = require("hull/src/infra");
const KueAdapter = require("hull/src/infra/queue/adapter/kue");

export default function connectorConfig(): HullConnectorConfig {
  const {
    SECRET = "1234",
    KUE_PREFIX = "intercom",
    REDIS_URL,
    QUEUE_NAME = "queueApp",
    COMBINED,
    SERVER,
    CLIENT_ID,
    CLIENT_SECRET,
    WORKER
  } = process.env;

  if (COMBINED !== "true" && WORKER !== "true" && SERVER !== "true") {
    throw new Error(
      "None of the processes were started, set any of COMBINED, SERVER or WORKER env vars"
    );
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "Can't find Client ID and/or Client Secret, check env vars"
    );
  }

  const startServer = COMBINED === "true" || SERVER === "true";
  const startWorker = COMBINED === "true" || WORKER === "true";
  const hostSecret = SECRET || "1234";
  return {
    manifest,
    handlers: handlers({
      hostSecret,
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET
    }),
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
