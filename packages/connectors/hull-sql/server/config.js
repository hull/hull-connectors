// @flow

import type { HullConnectorConfig } from "hull";
import Aws from "aws-sdk";
import express from "express";
import manifest from "../manifest.json";
import handlers from "./handlers";

const path = require("path");

// require("dotenv").config();

export default function connectorConfig(): HullConnectorConfig {
  const {
    LOG_LEVEL,
    SECRET,
    NODE_ENV,
    PORT = 8082,
    OVERRIDE_FIREHOSE_URL,
    AWS_REGION,
    AWS_KEY_ID,
    AWS_SECRET_KEY,
    SQS_QUEUE_URL,
    KUE_PREFIX,
    REDIS_URL,
    OVERRIDE_LOCK_DURATION = 60000,
    OVERRIDE_STALLED_INTERVAL = 60000,
    QUEUE_ADAPTER,
    CONNECTOR_TIMEOUT,
    RUN_TIMEOUT_MS,
    COMBINED,
    SERVER,
    WORKER,
    AWS_KEY_ID,
    AWS_SECRET_KEY
  } = process.env;

  const hostSecret = SECRET;
  const port = PORT || 8082;
  const devMode = NODE_ENV === "development";

  Aws.config.update({
    accessKeyId: AWS_KEY_ID,
    secretAccessKey: AWS_SECRET_KEY
  });

  const queueConfig =
    QUEUE_ADAPTER === "sqs" && SQS_QUEUE_URL
      ? {
          store: "sqs",
          region: AWS_REGION || "us-east-1",
          accessKeyId: AWS_KEY_ID,
          secretAccessKey: AWS_SECRET_KEY,
          queueUrl: SQS_QUEUE_URL
        }
      : REDIS_URL
      ? {
          store: "redis",
          name: KUE_PREFIX || "hull-sql",
          url: REDIS_URL,
          settings: {
            lockDuration: OVERRIDE_LOCK_DURATION || 60000,
            stalledInterval: OVERRIDE_STALLED_INTERVAL || 60000
          }
        }
      : { store: "memory" };

  return {
    manifest,
    hostSecret,
    devMode,
    port,
    cacheConfig: {
      store: "memory",
      ttl: 1
    },
    handlers: handlers(),
    middlewares: [
      // bodyParser.urlencoded({ extended: true }),
      express.static(
        `${path.dirname(path.join(require.main.filename, ".."))}/connectors`
      )
    ],
    logsConfig: {
      logLevel: LOG_LEVEL
    },
    clientConfig: {
      firehoseUrl: OVERRIDE_FIREHOSE_URL
    },
    timeout: CONNECTOR_TIMEOUT,
    workerConfig: {
      start: COMBINED || WORKER,
      queueName: "queueApp"
    },
    serverConfig: {
      start: COMBINED || SERVER
    },
    preview_timeout: RUN_TIMEOUT_MS || 60000,
    queueConfig
  };
}
