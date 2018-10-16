/* @flow */
const Hull = require("hull");
const express = require("express");

const server = require("./server");

const { LOG_LEVEL, NODE_ENV } = process.env;

if (LOG_LEVEL) {
  Hull.Client.logger.transports.console.level = LOG_LEVEL;
}

// Hull.logger.transports.console.json = true;

const options = {
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
