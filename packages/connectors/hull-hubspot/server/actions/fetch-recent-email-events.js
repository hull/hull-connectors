// @flow
import type { HullContext, HullExternalResponse } from "hull";

const _ = require("lodash");

const {
  HullDispatcher
} = require("../../../../hull-connector-framework/src/purplefusion/dispatcher");
const {
  hullService
} = require("../../../../hull-connector-framework/src/purplefusion/hull-service");
const glue = require("../purplefusion/hull-hubspot-events/server/glue");
const eventsService = require("../purplefusion/hull-hubspot-events/server/service");
const transforms = _.concat(
  [],
  require("../purplefusion/hull-hubspot-events/server/transforms-to-service"),
  require("../purplefusion/hull-hubspot-events/server/transforms-to-hull")
);

async function fetchRecentEmailEventsAction(
  ctx: HullContext
): HullExternalResponse {
  const services = { hubspot: eventsService, hull: hullService };
  const dispatcher = new HullDispatcher(
    glue,
    services,
    transforms,
    "setEventMap"
  );

  const route = "fetchRecentEmailEvents";

  const data = await dispatcher
    .dispatch(ctx, route)
    .then(() => {
      dispatcher.close();
      ctx.client.logger.info("incoming.job.success", {
        jobName: "Incoming Data Request"
      });
      return {
        status: "ok"
      };
    })
    .catch(error => {
      dispatcher.close();

      let message = "Unknown Error";
      if (error && error.message) {
        message = error.message;
      }
      ctx.client.logger.error("incoming.job.error", {
        jobName: "Incoming Data Request",
        error: message
      });
      return {
        error: error.message
      };
    });

  return {
    status: 200,
    data
  };
}

module.exports = fetchRecentEmailEventsAction;
