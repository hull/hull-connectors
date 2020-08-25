// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";

const _ = require("lodash");
const HullRouter = require("hull-connector-framework/src/purplefusion/router");

export default function connectorConfig(): HullConnectorConfig {
  return {
    manifest,
    handlers: new HullRouter({
      glue: require("./glue"),
      services: {
        zapier: require("./service")()
      },
      transforms: _.concat(
        require("./transforms-to-hull"),
        require("./transforms-to-service")
      ),
      ensureHook: ""
    }).createHandler,
    options: {
      outgoingMechanism: "trigger"
    }
  };
}
