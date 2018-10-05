const { Connector } = require("hull");
const express = require("express");

const server = require("../../../server/server");

function bootstrap() {
  const app = express();
  const connector = new Connector({
    hostSecret: "1234",
    port: 8000,
    clientConfig: { protocol: "http", firehoseUrl: "firehose" }
  });
  connector.setupApp(app);
  server(app, { connector });

  connector.startWorker();
  return connector.startApp(app);
}

module.exports = bootstrap;
