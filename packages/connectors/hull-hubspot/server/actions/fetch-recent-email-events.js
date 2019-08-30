// @flow
import type { HullContext, HullExternalResponse } from "hull";
import manifest from "../../manifest.json";

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

const hullRouter = new HullRouter({
  glue,
  services,
  transforms,
  ensureHook: "setEventMap"
});

const endpoint = _.find(_.get(manifest, "json", []), {
  name: "fetch_recent_email_events"
});

const incomingDispatchCallback = hullRouter.createIncomingDispatchCallback(
  endpoint
);

async function fetchRecentEmailEventsAction(
  ctx: HullContext
): HullExternalResponse {
  incomingDispatchCallback(ctx);

  return {
    status: 200,
    data: {
      status: "ok"
    }
  };
}

module.exports = fetchRecentEmailEventsAction;
