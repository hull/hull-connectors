// @flow
import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const {
    SECRET,
    NODE_ENV,
    FIREHOSE_KAFKA_BROKERS,
    FIREHOSE_KAFKA_TOPIC,
    LOG_LEVEL,
    PORT = 8082,
    REDIS_URL
  } = process.env;

  if (!REDIS_URL) {
    throw new Error("Missing REDIS_URL environment variable");
  }
  if (!FIREHOSE_KAFKA_BROKERS) {
    throw new Error("Missing FIREHOSE_KAFKA_BROKERS environment variable");
  }
  if (!FIREHOSE_KAFKA_TOPIC) {
    throw new Error("Missing FIREHOSE_KAFKA_TOPIC environment variable");
  }

  if (!SECRET && NODE_ENV != "development") {
    throw new Error("Missing SECRET environment variable");
  }

  const hostSecret = SECRET || "1234";
  return {
    manifest,
    hostSecret,
    devMode: NODE_ENV === "development",
    port: PORT,
    handlers: handlers({
      redisUri: REDIS_URL,
      firehoseTransport: {
        type: "kafka",
        brokersList: FIREHOSE_KAFKA_BROKERS.split(","),
        topic: FIREHOSE_KAFKA_TOPIC
      }
    }),
    middlewares: [],
    logsConfig: {
      logLevel: LOG_LEVEL
    },
    clientConfig: {},
    serverConfig: {
      start: true
    }
  };
}
