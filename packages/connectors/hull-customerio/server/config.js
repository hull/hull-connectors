// @flow

import type { HullConnectorConfig } from "hull";
import { Cache } from "hull/src/infra";
import manifest from "../manifest.json";

const {
  LOG_LEVEL,
  SECRET,
  PORT = 8082,
  NODE_ENV,
  OVERRIDE_FIREHOSE_URL
} = process.env;

const connectorConfig: HullConnectorConfig = {
  manifest,
  hostSecret: SECRET || "1234",
  devMode: NODE_ENV === "development",
  port: PORT || 8082,
  handlers: {},
  middlewares: [],
  cache: new Cache({
    store: "memory",
    ttl: 1
  }),
  logsConfig: {
    logLevel: LOG_LEVEL
  },
  clientConfig: {
    firehoseUrl: OVERRIDE_FIREHOSE_URL
  },
  serverConfig: {
    start: true
  }
};

export default connectorConfig;
