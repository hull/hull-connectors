// @flow
import type { HullContext, HullExternalResponse } from "hull";

async function fetchUsersAction(ctx: HullContext): HullExternalResponse {
  await Promise.resolve(ctx.enqueue("fetchRecentUsers"));
  return {
    status: 200,
    data: {
      response: "ok"
    }
  };
}

module.exports = fetchUsersAction;
