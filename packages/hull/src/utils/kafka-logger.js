// @flow

const Transport = require("winston-transport");
const { HighLevelProducer } = require("node-rdkafka");
const _ = require("lodash");
const uuid = require("uuid");

/**
 * Transport for outputting to Kafka.
 * Inherits from WinstonTransport to take advantage of `.exceptions.handle()`.
 *
 * @type {Kafka}
 * @extends {Transport}
 */
module.exports = class KafkaLogger extends Transport {
  constructor(options) {
    super(options);
    this._isConnected = false;

    if (!options.topic) {
      throw Error("You must explicitly set the Kafka topic");
    }
    this.topic = options.topic;

    // Connect
    const producerConfig = {
      "client.id": options.clientId,
      "metadata.broker.list": options.brokersList.join(","),
      "compression.codec": "gzip",
      "retry.backoff.ms": 200,
      "message.send.max.retries": 10,
      "socket.keepalive.enable": true,
      "queue.buffering.max.messages": 100,
      "queue.buffering.max.ms": 1000,
      "batch.num.messages": 100,
      "linger.ms": 10,
      dr_cb: true,
      ...options.producerOptions
    };

    console.warn("KafkaLogger producerConfig", producerConfig);

    const producer = new HighLevelProducer(producerConfig);

    producer.setPollInterval(1000);

    this.producer = producer;

    producer.on("ready", () => {
      this._isConnected = true;
    });

    producer.on("delivery-report", (err, report) => {
      if (err) {
        console.error(
          `[winston-kafka] ${err.message}`,
          JSON.stringify(_.pick(report, "topic", "partition", "offset"))
        );
      }
    });

    producer.on("error", err => {
      this._isConnected = false;
      console.error("[winston-kafka] Cannot connect to Kafka", err);
    });

    producer.connect();
  }

  log = async (info, cb) => {
    const { topic, producer } = this;
    const callback = cb || _.identity;
    if (this._isConnected) {
      try {
        const ctxe = info.context || {};
        const now = Date.now();

        const msg = {
          request_id: ctxe.request_id,
          connector_name: ctxe.connector_name,
          user_id: ctxe.user_id,
          user_anonymous_id: ctxe.user_anonymous_id,
          user_external_id: ctxe.user_external_id,
          user_email: ctxe.user_email,
          account_id: ctxe.account_id,
          account_domain: ctxe.account_domain,
          account_external_id: ctxe.account_external_id,
          account_anonymous_id: ctxe.account_anonymous_id,
          connector: ctxe.id,
          organization: ctxe.organization,
          subject_type: ctxe.subject_type,
          data: JSON.stringify(info.data),
          message: info.message,
          label: info.label,
          level: info.level,
          summary: info.summary,
          "@version": "1",
          "@timestamp": now
        };

        // topic, partition, message, key, timestamp, headers, callback
        await producer.produce(
          topic,
          null,
          Buffer.from(JSON.stringify(msg)),
          uuid(),
          now,
          null,
          _.identity
        );
        setImmediate(() => {
          this.emit("logged", info);
        });
        if (callback) {
          callback();
        }
      } catch (err) {
        console.error("[winston-kafka] Failed to log to Kafka", err);
      }
    } else {
      console.warn("[winston-kafka] is not connected yet !");
    }
  };
};
