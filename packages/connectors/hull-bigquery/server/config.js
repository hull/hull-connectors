import type { HullConnectorConfig } from "hull";
import manifest from "hull-bigquery/manifest";

const _ = require("lodash");
const HullRouter = require("hull-connector-framework/src/purplefusion/router");

export default function connectorConfig(): HullConnectorConfig {
  const { CLIENT_ID, CLIENT_SECRET } = process.env;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "Can't find BigQuery Client ID and/or Client Secret, check env vars"
    );
  }

  return {
    manifest,
    handlers: new HullRouter({
      serviceName: "bigquery",
      glue: require("./glue"),
      services: {
        bigquery: require("./service")({
          clientID: CLIENT_ID,
          clientSecret: CLIENT_SECRET
        })
      },
      transforms: require("./transforms-to-hull"),
      ensureHook: "ensure"
    }).createHandler
  };
}
