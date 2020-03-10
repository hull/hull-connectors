// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const {
    PORT = 8082,
    LOG_LEVEL,
    NODE_ENV,
    SECRET,
    FLOW_CONTROL_IN = 1,
    FLOW_CONTROL_SIZE = 200,
    LIBPROCESS_IP,
    MARATHON_APP_ID,
    MARATHON_APP_DOCKER_IMAGE,
    FIREHOSE_KAFKA_BROKERS,
    FIREHOSE_KAFKA_TOPIC,
    FIREHOSE_KAFKA_PRODUCER_QUEUE_BUFFERING_MAX_MS = 200
  } = process.env;

  // We're not using default assignments because "null" values makes Flow choke
  const hostSecret = SECRET || "1234";

  const metricsConfig = {};
  if (LIBPROCESS_IP) {
    metricsConfig.statsd_host = LIBPROCESS_IP;
    metricsConfig.statsd_port = 8125;
    metricsConfig.tags = {
      marathon_app_id: MARATHON_APP_ID,
      docker_image: MARATHON_APP_DOCKER_IMAGE
    };
  }

  const clientConfig = {};
  if (FIREHOSE_KAFKA_BROKERS && FIREHOSE_KAFKA_TOPIC) {
    clientConfig.firehoseTransport = {
      type: "kafka",
      brokersList: FIREHOSE_KAFKA_BROKERS.split(","),
      topic: FIREHOSE_KAFKA_TOPIC,
      producerConfig: {
        "queue.buffering.max.ms": parseInt(
          FIREHOSE_KAFKA_PRODUCER_QUEUE_BUFFERING_MAX_MS,
          10
        )
      }
    };
  }

  return {
    manifest,
    hostSecret,
    devMode: NODE_ENV === "development",
    port: PORT || 8082,
    timeout: "25s",
    handlers: handlers({
      flow_size: parseInt(FLOW_CONTROL_SIZE || 200, 10),
      flow_in: parseInt(FLOW_CONTROL_IN || 1, 10)
    }),
    middlewares: [],
    logsConfig: {
      logLevel: LOG_LEVEL
    },
    metricsConfig,
    clientConfig,
    serverConfig: {
      start: true
    }
  };
}
