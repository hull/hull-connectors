// @flow

import type { HullConnectorConfig } from "hull";
import Aws from "aws-sdk";
import express from "express";
import handlers from "./handlers";

const path = require("path");

// require("dotenv").config();

export default function connectorConfig(): HullConnectorConfig {
  const {
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
    RUN_TIMEOUT_MS
  } = process.env;

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
        cacheConfig: { store: "memory", ttl: 1 },
    handlers: handlers(),
    middlewares: [
      // bodyParser.urlencoded({ extended: true }),
      express.static(
        `${path.dirname(path.join(require.main.filename, ".."))}/connectors`
      )
    ],
    preview_timeout: RUN_TIMEOUT_MS || 60000,
    queueConfig
  };
}
