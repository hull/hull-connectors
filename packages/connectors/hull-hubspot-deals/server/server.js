/* @flow */
import type { $Application } from "express";

import type {
  HullContext,
  HullUserUpdateMessage,
  HullAccountUpdateMessage,
  HullRequest
} from "hull";

const cors = require("cors");
const bodyParser = require("body-parser");
const {
  HullRouter
} = require("hull-connector-framework/src/purplefusion/router");

const { jsonHandler } = require("hull/src/handlers");

const _ = require("lodash");

const hullRouter: HullRouter = new HullRouter({
  glue: require("./glue"),
  manifest: require("../manifest.json"),
  serviceDefinitions: { hubspot: require("./service") },
  transforms: _.concat(
    [],
    require("./transforms-to-service"),
    require("./transforms-to-hull")
  )
});

function server(app: $Application, deps: Object): $Application {
  hullRouter.provisionServer(app);

  const authHandler = hullRouter.createAuthHandler();
  if (authHandler !== null) {
    app.use("/auth", authHandler);
  }
}

module.exports = server;
