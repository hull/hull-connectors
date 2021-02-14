import Hull from "hull";
import { Cache } from "hull/lib/infra";
import redisStore from "cache-manager-redis";
import express from "express";

import server from "./server";

if (process.env.LOG_LEVEL) {
  Hull.logger.transports.console.level = process.env.LOG_LEVEL;
}

Hull.logger.transports.console.json = true;

const options = {
  Hull,
  hostSecret: process.env.SECRET || "1234",
  port: process.env.PORT || 8082,
  devMode: process.env.NODE_ENV === "development",
  onMetric: function onMetric(metric, value, ctx) {
    console.log(`[${ctx.id}] segment.${metric}`, value);
  }
};


if (process.env.LIBRATO_TOKEN && process.env.LIBRATO_USER) {
  const librato = require("librato-node"); // eslint-disable-line global-require
  librato.configure({
    email: process.env.LIBRATO_USER,
    token: process.env.LIBRATO_TOKEN
  });
  librato.on("error", function onError(err) {
    console.error(err);
  });

  process.once("SIGINT", function onSigint() {
    librato.stop(); // stop optionally takes a callback
  });
  librato.start();

  options.onMetric = function onMetricProduction(metric = "", value = 1, ctx = {}) {
    try {
      if (librato) {
        librato.measure(`segment.${metric}`, value, Object.assign({}, { source: ctx.id }));
      }
    } catch (err) {
      console.warn("error in librato.measure", err);
    }
  };
}

let cache;

if (process.env.REDIS_URL) {
  cache = new Cache({
    store: redisStore,
    url: process.env.REDIS_URL,
    ttl: process.env.SHIP_CACHE_TTL || 60
  });
} else {
  cache = new Cache({
    store: "memory",
    max: process.env.SHIP_CACHE_MAX || 100,
    ttl: process.env.SHIP_CACHE_TTL || 60
  });
}

const app = express();
const connector = new Hull.Connector({
  hostSecret: options.hostSecret,
  port: options.port,
  clientConfig: {
    firehoseUrl: process.env.OVERRIDE_FIREHOSE_URL
  },
  cache
});
options.clientMiddleware = connector.clientMiddleware();

connector.setupApp(app);

server(app, options);

connector.startApp(app);
