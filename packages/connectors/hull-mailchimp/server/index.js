/* @flow */
/**
 * Main project dependencies
 */
const Hull = require("hull");
const express = require("express");
const { Queue, Cache } = require("hull/src/infra");
const KueAdapter = require("hull/src/infra/queue/adapter/kue");

const _ = require("lodash");
const server = require("./server");
const worker = require("./worker");

const {
  PORT = 8082,
  LOG_LEVEL,
  SECRET = "1234",
  KUE_PREFIX = "hull-mailchimp",
  REDIS_URL,
  SHIP_CACHE_MAX,
  SHIP_CACHE_TTL,
  OVERRIDE_FIREHOSE_URL,
  COMBINED,
  SERVER,
  WORKER
} = process.env;

if (!_.isNil(LOG_LEVEL)) {
  Hull.Client.logger.transports.console.level = LOG_LEVEL;
}

Hull.Client.logger.transports.console.stringify = true;

const cache = new Cache({
  store: "memory",
  max: !_.isNil(SHIP_CACHE_MAX) ? parseInt(SHIP_CACHE_MAX, 10) : 100,
  ttl: !_.isNil(SHIP_CACHE_TTL) ? parseInt(SHIP_CACHE_TTL, 10) : 60
});

const kueAdapter = new KueAdapter({
  prefix: KUE_PREFIX,
  redis: REDIS_URL
});

const queue = new Queue(kueAdapter);

const connector = new Hull.Connector({
  hostSecret: SECRET,
  port: PORT,
  cache,
  queue,
  clientConfig: {
    firehoseUrl: OVERRIDE_FIREHOSE_URL
  }
});

let app = express();

if (COMBINED === "true" || SERVER === "true") {
  connector.setupApp(app);
  app = server(app);
  connector.startApp(app);
}

if (COMBINED === "true" || WORKER === "true") {
  worker(connector);
  connector.startWorker();
}

if (COMBINED !== "true" && WORKER !== "true" && SERVER !== "true") {
  throw new Error(
    "Non of the process was started, set any of COMBINED, SERVER or WORKER env vars"
  );
}
