/* @flow */
/* :: export type * from "hull-client"; */
/* :: export type * from "./types"; */

import HullClient from "hull-client";
import winston from "winston";
import type { HullConnectorConfig } from "./types/connector";
import { KafkaLogger } from "./utils";

const Worker = require("./connector/worker");
const ConnectorClass = require("./connector/hull-connector");

export type { HullConnectorConfig };
export { default as Client } from "hull-client";

const buildConfigurationFromEnvironment = env => {
  const {
    NODE_ENV,
    DISABLE_WEBPACK,
    LOG_LEVEL = "info",
    LIBPROCESS_IP,
    STATSD_HOST,
    STATSD_PORT,
    MARATHON_APP_ID,
    MARATHON_APP_DOCKER_IMAGE,
    FIREHOSE_KAFKA_BROKERS,
    FIREHOSE_KAFKA_TOPIC,
    FIREHOSE_KAFKA_TOPICS_MAPPING = "",
    FIREHOSE_KAFKA_PRODUCER_QUEUE_BUFFERING_MAX_MS = 200,
    FIREHOSE_KAFKA_ENABLED = true,
    LOGGER_KAFKA_BROKERS,
    LOGGER_KAFKA_TOPIC,
    LOGGER_KAFKA_ENABLED = true,
    LOGGER_KAFKA_PRODUCER_QUEUE_BUFFERING_MAX_MESSAGES = 100,
    LOGGER_KAFKA_PRODUCER_QUEUE_BUFFERING_MAX_MS = 1000,
    LOGGER_KAFKA_PRODUCER_BATCH_NUM_MESSAGES = 100,
    LOGGER_KAFKA_PRODUCER_LINGER_MS = 10,
    PORT = 8082,
    REQUEST_TIMEOUT = "25s",
    REDIS_URL,
    CACHE_REDIS_URL,
    SECRET,
    SHIP_CACHE_TTL,
    SHIP_CACHE_MAX,
    SHIP_CACHE_KEY_PREFIX,
    REDIS_MAX_CONNECTIONS = 50,
    REDIS_MIN_CONNECTIONS = 1
  } = env;

  const timeout = REQUEST_TIMEOUT;

  const devMode = NODE_ENV === "development";

  const metricsConfig = {};
  if (LIBPROCESS_IP || STATSD_HOST) {
    metricsConfig.statsd_host = LIBPROCESS_IP || STATSD_HOST;
    metricsConfig.statsd_port = STATSD_PORT || 8125;
    metricsConfig.tags = {
      ...(MARATHON_APP_ID ? { marathon_app_id: MARATHON_APP_ID } : {}),
      ...(MARATHON_APP_DOCKER_IMAGE
        ? { docker_image: MARATHON_APP_DOCKER_IMAGE }
        : {})
    };
  }

  const clientConfig = {};
  if (FIREHOSE_KAFKA_BROKERS && FIREHOSE_KAFKA_ENABLED !== "false") {
    const topicsMapping = FIREHOSE_KAFKA_TOPICS_MAPPING.split(",").reduce(
      (m, v) => {
        const [domain, topic] = v.split("=");
        m[domain] = topic;
        return m;
      },
      {}
    );

    clientConfig.firehoseTransport = {
      type: "kafka",
      brokersList: FIREHOSE_KAFKA_BROKERS.split(","),
      topic: FIREHOSE_KAFKA_TOPIC,
      topicsMapping,
      producerConfig: {
        "queue.buffering.max.ms": parseInt(
          FIREHOSE_KAFKA_PRODUCER_QUEUE_BUFFERING_MAX_MS,
          10
        )
      }
    };
  }

  clientConfig.logLevel = LOG_LEVEL;

  clientConfig.loggerTransport = [
    new winston.transports.Console({
      level: LOG_LEVEL,
      format: winston.format.simple()
    })
  ];

  if (LOGGER_KAFKA_BROKERS && LOGGER_KAFKA_TOPIC) {
    if (LOGGER_KAFKA_ENABLED !== "false") {
      clientConfig.loggerTransport.push(
        new KafkaLogger({
          brokersList: LOGGER_KAFKA_BROKERS.split(","),
          topic: LOGGER_KAFKA_TOPIC,
          level: "info",
          producerOptions: {
            "queue.buffering.max.messages": parseInt(
              LOGGER_KAFKA_PRODUCER_QUEUE_BUFFERING_MAX_MESSAGES,
              10
            ),
            "queue.buffering.max.ms": parseInt(
              LOGGER_KAFKA_PRODUCER_QUEUE_BUFFERING_MAX_MS,
              10
            ),
            "batch.num.messages": parseInt(
              LOGGER_KAFKA_PRODUCER_BATCH_NUM_MESSAGES,
              10
            ),
            "linger.ms": parseInt(LOGGER_KAFKA_PRODUCER_LINGER_MS, 10)
          }
        })
      );
    } else {
      console.warn("Skip kafka logger: ", { LOGGER_KAFKA_ENABLED });
    }
  }

  clientConfig.logger = winston.createLogger({
    level: LOG_LEVEL || "info",
    format: winston.format.json(),
    transports: clientConfig.loggerTransport
  });

  const disableWebpack = DISABLE_WEBPACK === "true";

  const port = PORT;

  if (!SECRET && NODE_ENV === "production") {
    throw new Error("Missing SECRET environment variable");
  }
  const hostSecret = SECRET || "please-change-me";

  // TODO: deprecate use of CACHE_REDIS_URL to make it consistent across all connectors
  const cacheAdapter =
    REDIS_URL !== undefined || CACHE_REDIS_URL !== undefined
      ? {
          store: "redis",
          url: REDIS_URL || CACHE_REDIS_URL,
          max: REDIS_MAX_CONNECTIONS,
          min: REDIS_MIN_CONNECTIONS
        }
      : { store: "memory" };

  const cacheConfig = {
    ...cacheAdapter,
    ttl: SHIP_CACHE_TTL || 60,
    max: SHIP_CACHE_MAX || 100,
    keyPrefix: SHIP_CACHE_KEY_PREFIX
  };

  const serverConfig = { start: true };

  return {
    cacheConfig,
    clientConfig,
    devMode,
    disableWebpack,
    hostSecret,
    metricsConfig,
    port,
    timeout,
    serverConfig
  };
};

export class Connector extends ConnectorClass {
  config: HullConnectorConfig;

  constructor(
    connectorConfig: HullConnectorConfig | (() => HullConnectorConfig)
  ) {
    const resolvedConfig =
      typeof connectorConfig === "function"
        ? connectorConfig()
        : connectorConfig;

    const configFromEnv = buildConfigurationFromEnvironment(process.env);

    Object.keys(configFromEnv).forEach(k => {
      const val = configFromEnv[k];
      if (typeof val === "object") {
        resolvedConfig[k] = {
          ...(configFromEnv[k] || {}),
          ...(resolvedConfig[k] || {})
        };
      } else {
        resolvedConfig[k] = resolvedConfig[k] || val;
      }
    });

    super(
      {
        Worker,
        Client: HullClient
      },
      resolvedConfig
    );
  }
}

const Hull = {
  Client: HullClient,
  Connector
};

export default Hull;
