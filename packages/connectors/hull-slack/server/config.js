// @flow

import type { HullConnectorConfig } from "hull";
import _ from "lodash";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const {
    SIGNING_SECRET = "1234",
    CLIENT_ID,
    CLIENT_SECRET,
  } = process.env;

  if (!CLIENT_ID || !CLIENT_SECRET || !SIGNING_SECRET) {
    throw new Error(
      "Can't find Slack Client ID and/or Client Secret and/or SIGNING_SECRET, check env vars"
    );
  }

  // We're not using default assignments because "null" values makes Flow choke
  const scopes = _.get(
    _.find(manifest.private_settings, s => s.format === "oauth"),
    "options.strategy.scope"
  );
  return {
        handlers: handlers({
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      signingSecret: SIGNING_SECRET,
      scopes
    })
  };
}
