// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

const { Queue } = require("hull/src/infra");
const KueAdapter = require("hull/src/infra/queue/adapter/kue");

export default function connectorConfig(): HullConnectorConfig {
  const {
    KUE_PREFIX = "hull-mailchimp",
    REDIS_URL,
    QUEUE_NAME = "queueApp",
    COMBINED,
    SERVER,
    MAILCHIMP_CLIENT_ID,
    MAILCHIMP_CLIENT_SECRET,
    WORKER,
    SECRET
  } = process.env;

  if (COMBINED !== "true" && WORKER !== "true" && SERVER !== "true") {
    throw new Error(
      "None of the processes were started, set any of COMBINED, SERVER or WORKER env vars"
    );
  }

  if (!MAILCHIMP_CLIENT_ID || !MAILCHIMP_CLIENT_SECRET) {
    throw new Error(
      "Can't find Mailchimp Client ID and/or Client Secret, check env vars"
    );
  }

  const hostSecret = SECRET || "1234";
  const startServer = COMBINED === "true" || SERVER === "true";
  const startWorker = COMBINED === "true" || WORKER === "true";
  return {
    manifest,
    handlers: handlers({
      hostSecret,
      clientID: MAILCHIMP_CLIENT_ID,
      clientSecret: MAILCHIMP_CLIENT_SECRET
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
