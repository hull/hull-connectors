// @flow

import type { HullHandlersConfiguration } from "hull";
const HullRouter = require("hull-connector-framework/src/purplefusion/router");

const handler = (adapter): HullHandlersConfiguration => {
  return new HullRouter({
    glue: require("./glue"),
    services: {
      sql: require("./sql-sequalize-service")(adapter)
    },
    transforms: require("./transforms-to-service"),
    ensureHook: "ensureHook"
  }).createHandler
};

export default handler;
