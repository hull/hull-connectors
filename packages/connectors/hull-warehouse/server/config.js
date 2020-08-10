// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";

const _ = require("lodash");
const HullRouter = require("hull-connector-framework/src/purplefusion/router");

export default function connectorConfig(): HullConnectorConfig {
  const { CLIENT_ID, CLIENT_SECRET } = process.env;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "Can't find PG Client ID and/or Client Secret, check env vars"
    );
  }

  return {
    manifest,
    handlers: new HullRouter({
      glue: require("./glue"),
      services: {
        postgres: require("./postgres-sequalize-service")({
          clientID: CLIENT_ID,
          clientSecret: CLIENT_SECRET
        })
      },
      transforms: require("./transforms-to-service"),
      ensureHook: "ensureHook"
    }).createHandler
  };
}
