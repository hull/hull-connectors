/* @flow */
const express = require("express");

const { Cache } = require("../../../hull/src/infra");
const Hull = require("../../../hull/src");
const server = require("./server");

const { PORT = 8082, SECRET, LOG_LEVEL } = process.env;

if (LOG_LEVEL) {
  Hull.Client.logger.transports.console.level = LOG_LEVEL;
}

const cache = new Cache({
  store: "memory",
  ttl: 1
});

const options = {
  port: PORT,
  hostSecret: SECRET,
  cache
};

const app = express();
const connector = new Hull.Connector(options);

connector.setupApp(app);
server(app);
connector.startApp(app);
