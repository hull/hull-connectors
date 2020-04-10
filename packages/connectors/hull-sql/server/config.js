// @flow

import type { HullConnectorConfig } from "hull";
import Aws from "aws-sdk";
import BullAdapter from "hull/src/infra/queue/adapter/bull";
import SqsAdapter from "hull/src/infra/queue/adapter/sqs";
import { Queue } from "hull/src/infra";
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
    OVERRIDE_LOCK_DURATION,
    OVERRIDE_STALLED_INTERVAL,
    QUEUE_ADAPTER,
    CONNECTOR_TIMEOUT,
    RUN_TIMEOUT_MS,
    COMBINED,
    SERVER,
    WORKER
  } = process.env;

  const hostSecret = SECRET;
  const port = PORT || 8082;
  const devMode = NODE_ENV === "development";

  Aws.config.update({
    accessKeyId: process.env.AWS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY
  });

  const cacheConfig = {
    store: "memory",
    ttl: 1
  };

  const logsConfig = {
    logLevel: LOG_LEVEL
  };
  const clientConfig = {
    firehoseUrl: OVERRIDE_FIREHOSE_URL
  };

  let queue;
  if (QUEUE_ADAPTER === "sqs" && SQS_QUEUE_URL) {
    queue = new Queue(
      new SqsAdapter({
        region: AWS_REGION || "us-east-1",
        accessKeyId: AWS_KEY_ID,
        secretAccessKey: AWS_SECRET_KEY,
        queueUrl: SQS_QUEUE_URL
      })
    );
  } else {
    queue = new Queue(
      new BullAdapter({
        prefix: KUE_PREFIX || "hull-sql",
        redis: REDIS_URL,
        settings: {
          lockDuration: OVERRIDE_LOCK_DURATION || 60000,
          stalledInterval: OVERRIDE_STALLED_INTERVAL || 60000
        }
      })
    );
  }

  const timeout = CONNECTOR_TIMEOUT;
  const preview_timeout = RUN_TIMEOUT_MS || 60000;

  return {
    manifest,
    hostSecret,
    devMode,
    port,
    cacheConfig,
    handlers: handlers(),
    middlewares: [
      // bodyParser.urlencoded({ extended: true }),
      express.static(
        `${path.dirname(path.join(require.main.filename, ".."))}/connectors`
      )
    ],
    logsConfig,
    clientConfig,
    timeout,
    workerConfig: {
      start: COMBINED || WORKER,
      queueName: "queueApp"
    },
    serverConfig: {
      start: COMBINED || SERVER
    },
    preview_timeout,
    queue
  };
}
