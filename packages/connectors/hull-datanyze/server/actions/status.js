// @flow
import type { HullContext, HullStatusResponse } from "hull";

// eslint-disable-next-line no-unused-vars
async function statusCheckAction(ctx: HullContext): HullStatusResponse {
  return { status: "ok", message: "ok" };
}

module.exports = statusCheckAction;
