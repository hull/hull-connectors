// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

const { Cache } = require("hull/src/infra");

export default function connectorConfig(): HullConnectorConfig {
  const {
    LOG_LEVEL,
    SECRET,
    PORT = 8082,
    NODE_ENV,
    OVERRIDE_FIREHOSE_URL,
    CLIENT_ID,
    CLIENT_SECRET
  } = process.env;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("CLIENT_ID and/or CLIENT_SECRET missing");
  }

  const hostSecret = SECRET || "1234";
  return {
    manifest,
    hostSecret,
    middlewares: [],
    handlers: handlers({
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET
    }),
    devMode: NODE_ENV === "development",
    port: PORT || 8082,
    cache: new Cache({
      store: "memory",
      isCacheableValue: () => false
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
