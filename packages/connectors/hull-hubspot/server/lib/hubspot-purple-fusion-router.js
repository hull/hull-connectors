/* @flow */
import type { HullContext } from "hull/src/types/context";
import manifest from "../../manifest";

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
    let endpoint = _.find(_.get(manifest, "json", []), {
      handler: this.route
    });

    if (_.isNil(endpoint)) {
      endpoint = _.find(_.get(manifest, "schedules", []), {
        handler: this.route
      });
    }

    if (_.isNil(endpoint)) {
      endpoint = _.find(_.get(manifest, "incoming", []), {
        handler: this.route
      });
    }

    return this.hullRouter.createIncomingDispatchCallback(endpoint)(ctx, data);
  }
}

module.exports = HubspotPurpleFusionRouter;
