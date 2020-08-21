import type { HullConnectorConfig } from "hull";
import manifest from "hull-bigquery/manifest";

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
      "Can't find Bigquery Client ID and/or Client Secret, check env vars"
    );
  }

  return {
    manifest,
    handlers: new HullRouter({
      serviceName: "bigquery",
      glue: require("./glue"),
      services: { bigquery:  require("./service")({
          clientID: CLIENT_ID,
          clientSecret: CLIENT_SECRET
        })
      },
      transforms: require("./transforms-to-hull"),
      ensureHook: "ensure"
    }).createHandler,
    hostSecret: SECRET,
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
