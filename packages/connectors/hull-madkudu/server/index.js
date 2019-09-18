const express = require("express");
const Hull = require("hull");
const server = require("./server");
const pkg = require("../package.json");

const {
  SECRET = "1234",
  OVERRIDE_FIREHOSE_URL,
  LOG_LEVEL,
  PORT = 8082,
  NODE_ENV = "production"
} = process.env;

const options = {
  skipSignatureValidation: NODE_ENV === "development",
  hostSecret: SECRET,
  port: PORT,
  ngrok: {
    subdomain: pkg.name
  },
  Hull,
  clientConfig: {
    firehoseUrl: OVERRIDE_FIREHOSE_URL
  }
};

if (LOG_LEVEL) {
  Hull.logger.transports.console.level = LOG_LEVEL;
}

Hull.logger.transports.console.json = true;

const connector = new Hull.Connector(options);
const app = express();
connector.setupApp(app);
server(app);
connector.startApp(app);
