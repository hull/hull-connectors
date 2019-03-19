import { Connector } from "hull";
import express from "express";

import { Cache } from "hull/lib/infra";

import { middleware } from "../../../server/lib/crypto";
import server from "../../../server/server";

export default function bootstrap() {
  const cache = new Cache({
    store: "memory",
    ttl: 1
  });

  const options = {
    hostSecret: "1234",
    port: 8000,
    cache,
    clientConfig: { protocol: "http", firehoseUrl: "firehose" },
    mongoDbConnectionUrl: "mongodb://localhost",
    dbName: "incoming-webhooks-tests"
  };

  let app = express();
  const connector = new Connector(options);
  app.use(middleware(connector.hostSecret));
  connector.setupApp(app);
  app = server(connector, options, app);
  return connector.startApp(app);
}
