// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";

const { canariesStatus, canariesRestart } = require("./canaries/handler");
const { canaryNotify } = require("./canaries/notify");

export default function connectorConfig(): HullConnectorConfig {
  const {
    LOG_LEVEL,
    SECRET,
    PORT = 8082,
    NODE_ENV,
    CLIENT_ID,
    CLIENT_SECRET,
    OVERRIDE_FIREHOSE_URL,
  } = process.env;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "Can't find Copper Client ID and/or Client Secret, check env vars"
    );
  }

  return {
    manifest,
    handlers: {
      subscriptions: {
        userUpdate: (context, data) =>
          canaryNotify("user:update", context, data),
        accountUpdate: (context, data) =>
          canaryNotify("account:update", context, data)
      },
      schedules: {
        canaryStart: canariesRestart
      },
      json: {
        canariesStatus,
        canaryStart: canariesRestart
      }
    },
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
