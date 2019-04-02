// @flow

import type { HullConnectorConfig } from "hull";
import { Cache } from "hull/src/infra";
import manifest from "../manifest.json";
import { middleware } from "./lib/crypto";

export default function connectorConfig(): HullConnectorConfig {
  const {
    LOG_LEVEL,
    SECRET,
    PORT = 8082,
    NODE_ENV,
    OVERRIDE_FIREHOSE_URL
  } = process.env;
  const hostSecret = SECRET || "1234";
  return {
    manifest,
    hostSecret,
    devMode: NODE_ENV === "development",
    port: PORT || 8082,
    handlers: {},
    middlewares: [middleware(hostSecret)],
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
}
