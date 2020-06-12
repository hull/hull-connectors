// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";

const { canariesStatus, canariesRestart } = require("./canaries/handler");
const { canaryNotify } = require("./canaries/notify");

export default function connectorConfig(): HullConnectorConfig {
  const { CLIENT_ID, CLIENT_SECRET } = process.env;

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
    }
  };
}
