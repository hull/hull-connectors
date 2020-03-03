// @flow

import Kafka from "node-rdkafka";

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
    dr_cb: true,
    ...kafkaProducerConfig
  };
  const producer = new Kafka.HighLevelProducer(producerConfig);

  producer.setPollInterval(1000);

  producer.on("delivery-report", (err, report) => {
    if (err) {
      console.log("delivery-report", { err, report });
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
      resolve(producer);
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

  if (!kafkaTopic) {
    throw new Error("Invalid kafka configuration: missinsg topic");
  }

  const { organization } = config;
  return ({ type, requestId, body, context }: FirehoseCallArguments) => {
    if (IS_EXITING)
      throw new Error(
        "Process is shutting down. Not accepting connections anymore"
      );

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
      message.claims = claims;
    }

    const producerName = config.connectorName || "";

    return getProducer(firehoseTransport, producerName).then(
      producer => {
        return new Promise((resolve, reject) => {
          producer.produce(
            kafkaTopic,
            null,
            Buffer.from(JSON.stringify(message)),
            `${organization}/${message.appId}`,
            Date.now(),
            (err, offset) => {
              if (err) {
                logger.error(`incoming.${type}.error`, {
                  err: err.message,
                  message,
                  topic: kafkaTopic
                });
                const clientError = new Error();
                clientError.message = "Backend publication error";
                return reject(clientError);
              }
              return resolve({ ok: true, offset });
            }
          );
        });
      },
      () => {
        const timeoutError = new Error();
        timeoutError.message = "Backend connection timeout";
        return Promise.reject(timeoutError);
      }
    );
  };
}

function flushProducer(brokers, { producer, ready }) {
  return ready.then(() => {
    return new Promise(resolve => {
      producer.flush(30000, err => {
        if (err) {
          console.warn("Error flushing Kafka producer", err);
        }
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
