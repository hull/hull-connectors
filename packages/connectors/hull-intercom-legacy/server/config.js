// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const { SECRET = "1234", CLIENT_ID, CLIENT_SECRET } = process.env;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "Can't find Client ID and/or Client Secret, check env vars"
    );
  }

  return {
    manifest,
    handlers: handlers({
      hostSecret: SECRET || "1234",
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET
    })
  };
}
