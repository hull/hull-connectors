/* @flow */
import type { HullContext } from "hull/src/types/context";

const _ = require("lodash");

const HullRouter = require("hull-connector-framework/src/purplefusion/router");
const {
  hullService
} = require("hull-connector-framework/src/purplefusion/hull-service");
const glue = require("../purplefusion/glue");
const eventsService = require("../purplefusion/service");

const services = { hubspot: eventsService, hull: hullService };
const transforms = _.concat(
  [],
  require("../purplefusion/transforms-to-service"),
  require("../purplefusion/transforms-to-hull")
);

const ensureHook = "";

class HubspotPurpleFusionRouter {
  hullRouter: HullRouter;

  route: string;

  constructor(route: string) {
    this.route = route;

    this.hullRouter = new HullRouter({
      glue,
      services,
      transforms,
      ensureHook
    });
  }

  async invokeRoute(ctx: HullContext, data: Object) {
    const endpoint = {
      handler: this.route
    };

    return this.hullRouter.createIncomingDispatchCallback(endpoint)(ctx, data);
  }
}

module.exports = HubspotPurpleFusionRouter;
