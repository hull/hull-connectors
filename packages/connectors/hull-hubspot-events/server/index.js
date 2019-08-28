/* @flow */
import type { HullRequest } from "hull";

const Hull = require("hull");
const express = require("express");
const redisStore = require("cache-manager-redis");
const { Cache } = require("hull/src/infra");

const _ = require("lodash");

const { jsonHandler } = require("hull/src/handlers");
const {
  HullRouter
} = require("hull-connector-framework/src/purplefusion/router");
const server = require("./server");

const {
  LOG_LEVEL,
  SHIP_CACHE_TTL = 60,
  SHIP_CACHE_MAX = 100,
  REDIS_URL,
  REDIS_MAX_CONNECTIONS = 5,
  REDIS_MIN_CONNECTIONS = 1
} = process.env;

if (LOG_LEVEL) {
  Hull.Client.logger.transports.console.level = LOG_LEVEL;
}

// Hull.logger.transports.console.json = true;

let cache;
if (REDIS_URL) {
  cache = new Cache({
    store: redisStore,
    url: REDIS_URL,
    ttl: SHIP_CACHE_TTL,
    max: REDIS_MAX_CONNECTIONS,
    min: REDIS_MIN_CONNECTIONS
  });
} else {
  cache = new Cache({
    store: "memory",
    max: SHIP_CACHE_MAX,
    ttl: SHIP_CACHE_TTL
  });
}

const options = {
  cache,
  hostSecret: process.env.SECRET || "BOOM",
  port: process.env.PORT || 8082,
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
};

const app = express();
const connector = new Hull.Connector(options);

connector.setupApp(app);
server(app, options);
connector.startApp(app);
