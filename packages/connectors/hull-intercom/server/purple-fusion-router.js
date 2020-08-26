/* @flow */
import type { HullContext } from "hull/src/types/context";

const _ = require("lodash");
const HullRouter = require("hull-connector-framework/src/purplefusion/router");
const glue = require("./glue");
const service = require("./service");

const {
  CLIENT_ID,
  CLIENT_SECRET
} = process.env;

const transforms = _.concat(
  [],
  require("./transforms-to-service"),
  require("./transforms-to-hull")
);

const services = {
  intercom: service({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET
  })
}

class PurpleFusionRouter {
  hullRouter: HullRouter;

  route: string;

  constructor(route: string) {
    this.route = route;

    this.hullRouter = new HullRouter({
      glue,
      services,
      transforms,
      ensureHook: "ensure"
    });
  }

  async invokeRoute(ctx: HullContext, data: Object) {
    const endpoint = {
      handler: this.route
    };

    return this.hullRouter.createIncomingDispatchCallback(endpoint)(ctx, data);
  }
}

module.exports = PurpleFusionRouter;
