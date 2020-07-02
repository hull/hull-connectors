// @flow
import type { HullContext, HullExternalResponse } from "hull";

async function fetchLeadsAction(ctx: HullContext): HullExternalResponse {
  await Promise.resolve(ctx.enqueue("fetchRecentLeads"));
  return {
    status: 200,
    data: {
      response: "ok"
    }
  };
}

module.exports = fetchLeadsAction;
