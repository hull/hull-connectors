// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";

const _ = require("lodash");
const HullRouter = require("hull-connector-framework/src/purplefusion/router");

export default function connectorConfig(): HullConnectorConfig {
    const {
    LOG_LEVEL,
    SECRET,
    PORT = 8082,
    NODE_ENV,
    CLIENT_ID,
    CLIENT_SECRET,
    OVERRIDE_FIREHOSE_URL
  } = process.env;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "Can't find Outreach Client ID and/or Client Secret, check env vars"
    );
  }

  return {
    manifest,
    handlers: new HullRouter({
      glue: require("./glue"),
      services: {
        outreach: require("./service")({
          clientID: CLIENT_ID,
          clientSecret: CLIENT_SECRET
        })
      },
      transforms: _.concat(
        require("./transforms-to-hull"),
        require("./transforms-to-service")
      ),
      ensureHook: "ensureWebhooks"
    }).createHandler,
    hostSecret: SECRET || "1234",
    devMode: NODE_ENV === "development",
    port: PORT || 8082,
    middlewares: [],
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
