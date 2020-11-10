// @flow

import type { HullConnectorConfig } from "hull";
import Aws from "aws-sdk";
import handlers from "./handlers";

// require("dotenv").config();

export default function connectorConfig(): HullConnectorConfig {
  const {
    QUEUE_NAME = "queueApp",
    KUE_PREFIX = "hull-snowflake-importer",
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    REDIS_URL,
    CONNECTOR_TIMEOUT,
    RUN_TIMEOUT_MS,
    COMBINED,
    SERVER,
    WORKER
  } = process.env;

  Aws.config.update({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  });

  if (COMBINED !== "true" && WORKER !== "true" && SERVER !== "true") {
    throw new Error(
      "None of the processes were started, set any of COMBINED, SERVER or WORKER env vars"
    );
  }
  if (REDIS_URL && !KUE_PREFIX) {
    throw new Error("Missing KUE_PREFIX to define queue name");
  }

  return {
      handlers: handlers(),
    serverConfig: {
      start: COMBINED === "true" || SERVER === "true"
    },
    workerConfig: {
      start: COMBINED === "true" || WORKER === "true",
      queueName: QUEUE_NAME || "queue"
    },
    timeout: CONNECTOR_TIMEOUT,
    preview_timeout: RUN_TIMEOUT_MS || 60000,
    queueConfig: REDIS_URL
      ? {
          store: "redis",
          url: REDIS_URL,
          name: KUE_PREFIX
        }
      : { store: "memory" }
  };
}
