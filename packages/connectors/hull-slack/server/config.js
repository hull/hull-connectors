// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const {
    PORT = 8082,
    LOG_LEVEL,
    NODE_ENV,
    SECRET = "1234",
    OVERRIDE_FIREHOSE_URL,
    CLIENT_ID,
    CLIENT_SECRET,
    SIGNING_SECRET
  } = process.env;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "Can't find Slack Client ID and/or Client Secret, check env vars"
    );
  }

  const hostSecret = SECRET || "1234";
  const port = PORT || 8082;
  const devMode = NODE_ENV === "development";

  return {
    manifest,
    devMode,
    logLevel: LOG_LEVEL,
    hostSecret,
    port,
    middlewares: [],
    handlers: handlers({
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      signingSecret: SIGNING_SECRET,
      scopes: manifest.tabs[0].options.params.strategy.scope,
      devMode
    }),
    clientConfig: {
      firehoseUrl: OVERRIDE_FIREHOSE_URL
    }
  };
}
