// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const {
    KUE_PREFIX = "hull-mailchimp",
    REDIS_URL,
    QUEUE_NAME = "queueApp",
    COMBINED,
    SERVER,
    WORKER,
    MAILCHIMP_CLIENT_ID,
    MAILCHIMP_CLIENT_SECRET
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
  if (REDIS_URL && !KUE_PREFIX) {
    throw new Error("Missing KUE_PREFIX to define queue name");
  }

  return {
    manifest,
    handlers: handlers({
      clientID: MAILCHIMP_CLIENT_ID,
      clientSecret: MAILCHIMP_CLIENT_SECRET
    }),
    serverConfig: {
      start: COMBINED === "true" || SERVER === "true"
    },
    workerConfig: {
      start: COMBINED === "true" || WORKER === "true",
      queueName: QUEUE_NAME || "queue"
    },
    clientConfig: {
      firehoseUrl: OVERRIDE_FIREHOSE_URL
    },
    cacheConfig: {
      store: "memory",
      max: !_.isNil(SHIP_CACHE_MAX) ? parseInt(SHIP_CACHE_MAX, 10) : 100,
      ttl: !_.isNil(SHIP_CACHE_TTL) ? parseInt(SHIP_CACHE_TTL, 10) : 60
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
