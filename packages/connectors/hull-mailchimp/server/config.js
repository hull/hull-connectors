// @flow

import type { HullConnectorConfig } from "hull";
import _ from "lodash";
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
    KUE_PREFIX = "hull-mailchimp",
    REDIS_URL,
    SHIP_CACHE_MAX,
    SHIP_CACHE_TTL,
    QUEUE_NAME = "queueApp",
    OVERRIDE_FIREHOSE_URL,
    COMBINED,
    SERVER,
    MAILCHIMP_CLIENT_ID,
    MAILCHIMP_CLIENT_SECRET,
    WORKER
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

  const startServer = COMBINED === "true" || SERVER === "true";
  const startWorker = COMBINED === "true" || WORKER === "true";
  const hostSecret = SECRET || "1234";
  return {
    manifest,
    devMode: NODE_ENV === "development",
    logLevel: LOG_LEVEL,
    hostSecret,
    port: PORT || 8082,
    handlers: handlers({
      hostSecret,
      clientID: MAILCHIMP_CLIENT_ID,
      clientSecret: MAILCHIMP_CLIENT_SECRET
    }),
    middlewares: [],
    serverConfig: {
      start: startServer
    },
    workerConfig: {
      start: startWorker,
      queueName: QUEUE_NAME || "queue"
    },
    clientConfig: {
      firehoseUrl: OVERRIDE_FIREHOSE_URL,
      connectorName: _.kebabCase(manifest.name)
    },
    cache: {
      store: "memory",
      max: !_.isNil(SHIP_CACHE_MAX) ? parseInt(SHIP_CACHE_MAX, 10) : 100,
      ttl: !_.isNil(SHIP_CACHE_TTL) ? parseInt(SHIP_CACHE_TTL, 10) : 60
    },
    queue: new Queue(
      new KueAdapter({
        prefix: KUE_PREFIX,
        redis: REDIS_URL
      })
    )
  };
}
