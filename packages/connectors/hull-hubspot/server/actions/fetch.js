/* @flow */
import type { HullContext, HullExternalResponse } from "hull";

const HubspotPurpleFusionRouter = require("../lib/hubspot-purple-fusion-router");

/**
 * Handles operation for automatic sync changes of hubspot profiles
 * to hull users.
 */
async function fetchAction(ctx: HullContext): HullExternalResponse {
  const route = "fetchRecentContacts";

  const router = new HubspotPurpleFusionRouter(route);
  await router.invokeRoute(ctx);

  return {
    status: 200,
    data: {
      status: "ok"
    }
  };
}

module.exports = fetchAction;
