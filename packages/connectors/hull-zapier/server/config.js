// @flow

import type { HullConnectorConfig } from "hull";

const _ = require("lodash");
const HullRouter = require("hull-connector-framework/src/purplefusion/router");

export default function connectorConfig(): HullConnectorConfig {
  return {
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
