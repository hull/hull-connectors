/* @flow */
const Hull = require("hull");
const express = require("express");

const server = require("./server");

const { LOG_LEVEL, SECRET, PORT } = process.env;

if (LOG_LEVEL) {
  Hull.Client.logger.transports.console.level = LOG_LEVEL;
}

const options = {
  hostSecret: SECRET || "1234",
  port: PORT || 8082,
  timeout: "2m",
  skipSignatureValidation: process.env.SKIP_SIGNATURE_VALIDATION === "true"
};

const app = express();
const connector = new Hull.Connector(options);

connector.setupApp(app);
server(app);
connector.startApp(app);
