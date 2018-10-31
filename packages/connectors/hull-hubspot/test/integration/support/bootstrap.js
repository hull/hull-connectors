const Hull = require("hull");
const express = require("express");

const server = require("../../../server/server");

module.exports = function bootstrap(port) {
  Hull.Client.logger.transports.console.level = "debug";
  const app = express();
  const connector = new Hull.Connector({ hostSecret: "1234", port, clientConfig: { protocol: "http" } });
  connector.setupApp(app);
  server(app, { queue: connector.queue, clientID: "123", clientSecret: "abc" });

  return connector.startApp(app);
};
