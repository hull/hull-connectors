// @flow
import type { HullContext, HullExternalResponse } from "hull";

const HubspotPurpleFusionRouter = require("../lib/hubspot-purple-fusion-router");

async function fetchRecentEmailEventsAction(
  ctx: HullContext
): HullExternalResponse {
  const route = "fetchRecentEmailEvents";

  const router = new HubspotPurpleFusionRouter(route);
  router.invokeRoute(ctx);

  return {
    status: 200,
    data: {
      status: "ok"
    }
  };
}

module.exports = fetchRecentEmailEventsAction;
