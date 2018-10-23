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

// const appMiddleware = require("./lib/middleware/app");
const jobs = require("./jobs");
// const actions = require("./actions");
// const notifHandlers = require("./notif-handlers");

const {
  PORT = 8082,
  LOG_LEVEL,
  SECRET = "1234",
  MAILCHIMP_CLIENT_ID,
  MAILCHIMP_CLIENT_SECRET,
  KUE_PREFIX = "hull-mailchimp",
  REDIS_URL,
  SHIP_CACHE_MAX,
  SHIP_CACHE_TTL,
  OVERRIDE_FIREHOSE_URL,
  COMBINED,
  WEB,
  WORKER
} = process.env;

if (!_.isNil(LOG_LEVEL)) {
  Hull.Client.logger.transports.console.level = LOG_LEVEL;
}

Hull.Client.logger.transports.console.stringify = true;

const shipConfig = {
  hostSecret: SECRET,
  clientID: MAILCHIMP_CLIENT_ID,
  clientSecret: MAILCHIMP_CLIENT_SECRET
};

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

const options = {
  hullMiddleware: connector.clientMiddleware(),
  connector,
  shipConfig,
  cache,
  queue,
  jobs
};

let app = express();

if (COMBINED === "true" || WEB === "true") {
  connector.setupApp(app);
  app = server(app);
  connector.startApp(app);
}

if (COMBINED === "true" || WORKER === "true") {
  worker(options);
  connector.startWorker();
}
