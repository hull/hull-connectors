// @flow

import type { HullConnectorConfig } from "hull";
import _ from "lodash";
import manifest from "../manifest.json";
import handlers from "./handlers";

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
    cacheConfig: {
      store: "memory",
      isCacheableValue: () => false
    },
    logsConfig: {
      logLevel: LOG_LEVEL
    },
    clientConfig: {
      firehoseUrl: OVERRIDE_FIREHOSE_URL,
      connectorName: _.kebabCase(manifest.name)
    },
    serverConfig: {
      start: true
    }
  };
}
