// @flow
import type { HullConnectorConfig } from "hull";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const {
    FIREHOSE_KAFKA_BROKERS,
    FIREHOSE_KAFKA_TOPIC,
    REDIS_URL,
    HULL_DOMAIN,
    REMOTE_DOMAIN,
    FIREHOSE_KAFKA_PRODUCER_QUEUE_BUFFERING_MAX_MS = 200
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
  if (!HULL_DOMAIN) {
    throw new Error("Missing HULL_DOMAIN environment variable");
  }

  if (!REMOTE_DOMAIN) {
    throw new Error("Missing REMOTE_DOMAIN environment variable");
  }

  return {
    trustProxy: true,
    handlers: handlers({
      redisUri: REDIS_URL,
      HULL_DOMAIN,
      REMOTE_DOMAIN,
      firehoseTransport: {
        type: "kafka",
        brokersList: FIREHOSE_KAFKA_BROKERS.split(","),
        topic: FIREHOSE_KAFKA_TOPIC,
        producerConfig: {
          "queue.buffering.max.ms": parseInt(
            FIREHOSE_KAFKA_PRODUCER_QUEUE_BUFFERING_MAX_MS,
            10
          )
        }
      }
    })
  };
}
