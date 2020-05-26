// @flow

import Kafka from "node-rdkafka";
import _ from "lodash";
import { promisify } from "util";

import type {
  HullClientInstanceConfig,
  HullClientLogger,
  HullFirehoseKafkaTransport,
  HullUserClaims,
  HullAccountClaims
} from "../types";

type FirehoseMessage = {
  type: "track" | "traits" | "alias",
  requestId: string,
  payload: any,
  organization: string,
  appId: string,
  timestamp: Date,
  accessToken?: string,
  claims?: any
};

type FirehoseCallArguments = {
  type: "track" | "traits" | "alias",
  body: any,
  requestId: string
};

type FirehoseMessageClaims = {
  "io.hull.subjectType": "user" | "account",
  "io.hull.asUser"?: HullUserClaims,
  "io.hull.asAccount"?: HullAccountClaims
};

const PRODUCERS = {};
let IS_EXITING = false;

function buildProducer(
  transport: HullFirehoseKafkaTransport,
  connectorName: string
) {
  const kafkaBrokersList: Array<string> = transport.brokersList;
  const kafkaTopic: string = transport.topic;
  const kafkaProducerConfig: Object = transport.producerConfig || {};

  if (!kafkaBrokersList || !kafkaBrokersList.length) {
    throw new Error("Configuration `kafkaBrokersList` is empty");
  }
  if (!kafkaTopic) {
    throw new Error("Configuration `kafkaTopic` is empty");
  }
  const producerConfig = {
    "client.id": connectorName,
    "metadata.broker.list": kafkaBrokersList.join(","),
    "retry.backoff.ms": 200,
    "message.send.max.retries": 10,
    "socket.keepalive.enable": true,
    "queue.buffering.max.messages": 1000,
    "queue.buffering.max.ms": 100,
    "batch.num.messages": 1000,
    "linger.ms": 10,
    partitioner: "random",
    dr_cb: true,
    ...kafkaProducerConfig
  };
  const producer = new Kafka.HighLevelProducer(producerConfig);

  producer.setPollInterval(1000);

  producer.on("delivery-report", (err, report) => {
    if (err) {
      console.log(
        "delivery-report",
        JSON.stringify({ err: err.message, report })
      );
    }
  });

  producer.connect();
  const ready = new Promise((resolve, reject) => {
    const connectTimeout = setTimeout(() => {
      const err = new Error();
      err.message = "Kafka producer connection timeout";
      reject(err);
    }, 5000);

    producer.on("ready", () => {
      clearTimeout(connectTimeout);
      resolve(promisify(producer.produce.bind(producer)));
    });
  });

  return { producer, ready };
}

function getProducer(
  transport: HullFirehoseKafkaTransport,
  connectorName: string
) {
  const brokers = transport.brokersList.join(",");
  PRODUCERS[brokers] =
    PRODUCERS[brokers] || buildProducer(transport, connectorName);
  return PRODUCERS[brokers].ready;
}

function getInstance(
  firehoseTransport: HullFirehoseKafkaTransport,
  config: HullClientInstanceConfig,
  logger: HullClientLogger
) {
  const kafkaTopic = firehoseTransport.topic;
  const kafkaTopicsMapping = firehoseTransport.topicsMapping;

  if (!kafkaTopic && !kafkaTopicsMapping) {
    throw new Error("Invalid kafka configuration: missing topic configuration");
  }

  const { organization, additionalClaims = {} } = config;
  return async ({ type, requestId, body, context }: FirehoseCallArguments) => {
    if (IS_EXITING)
      throw new Error(
        "Process is shutting down. Not accepting connections anymore"
      );

    const hullDomain = organization.replace(/^[^.]*\./, "");
    const topic = kafkaTopicsMapping[hullDomain] || kafkaTopic;

    if (!topic) {
      throw new Error(
        `Invalid kafka configuration: Topic not found for domain: ${hullDomain}`
      );
    }

    const message: FirehoseMessage = {
      type,
      requestId,
      payload: body,
      context,
      organization,
      appId: config.id,
      timestamp: new Date()
    };
    if (config.accessToken) {
      message.accessToken = config.accessToken;
    } else if (config.subjectType !== undefined) {
      const claims: FirehoseMessageClaims = {
        "io.hull.subjectType": config.subjectType
      };
      if (config.userClaim) claims["io.hull.asUser"] = config.userClaim;
      if (config.accountClaim)
        claims["io.hull.asAccount"] = config.accountClaim;

      if (_.has(additionalClaims, "scopes")) {
        claims.scopes = additionalClaims.scopes;
      }

      if (_.has(additionalClaims, "create")) {
        claims["io.hull.create"] = additionalClaims.create;
      }

      if (_.has(additionalClaims, "active")) {
        claims["io.hull.active"] = additionalClaims.active;
      }

      message.claims = claims;
    }

    const producerName = config.connectorName || "";
    try {
      const produceMessage = await getProducer(firehoseTransport, producerName);
      const offset = await produceMessage(
        topic,
        null,
        Buffer.from(JSON.stringify(message)),
        `${organization}/${message.appId}`,
        Date.now()
      );
      return { ok: true, offset };
    } catch (err) {
      logger.error("firehose.error", { error: err });
      const error = new Error("Producer error");
      error.status = 503;
      throw error;
    }
  };
}

function flushProducer(brokers, { producer, ready }) {
  return ready.then(() => {
    return new Promise(resolve => {
      producer.flush(30000, err => {
        if (err) throw err;
        resolve(`Flushed KafkaProducer on ${brokers}`);
      });
    });
  });
}

function exit() {
  IS_EXITING = true;
  const brokersLists = Object.keys(PRODUCERS);
  const flushes = brokersLists.map(brokers =>
    flushProducer(brokers, PRODUCERS[brokers])
  );
  return Promise.all(flushes);
}

module.exports = { getInstance, exit };
