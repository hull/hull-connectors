"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _hull = _interopRequireDefault(require("hull"));

var _infra = require("hull/lib/infra");

var _cacheManagerRedis = _interopRequireDefault(require("cache-manager-redis"));

var _express = _interopRequireDefault(require("express"));

var _server = _interopRequireDefault(require("./server"));

if (process.env.LOG_LEVEL) {
  _hull.default.logger.transports.console.level = process.env.LOG_LEVEL;
}

_hull.default.logger.transports.console.json = true;
const options = {
  Hull: _hull.default,
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
        librato.measure(`segment.${metric}`, value, Object.assign({}, {
          source: ctx.id
        }));
      }
    } catch (err) {
      console.warn("error in librato.measure", err);
    }
  };
}

let cache;

if (process.env.REDIS_URL) {
  cache = new _infra.Cache({
    store: _cacheManagerRedis.default,
    url: process.env.REDIS_URL,
    ttl: process.env.SHIP_CACHE_TTL || 60
  });
} else {
  cache = new _infra.Cache({
    store: "memory",
    max: process.env.SHIP_CACHE_MAX || 100,
    ttl: process.env.SHIP_CACHE_TTL || 60
  });
}

const app = (0, _express.default)();
const connector = new _hull.default.Connector({
  hostSecret: options.hostSecret,
  port: options.port,
  clientConfig: {
    firehoseUrl: process.env.OVERRIDE_FIREHOSE_URL
  },
  cache
});
options.clientMiddleware = connector.clientMiddleware();
connector.setupApp(app);
(0, _server.default)(app, options);
connector.startApp(app);