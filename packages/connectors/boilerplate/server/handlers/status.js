/* @flow */
import type { HullContext, HullStatusResponse } from "hull";

async function statusCheckAction(_ctx: HullContext): HullStatusResponse {
  return {
    status: "ok"
  };
}

module.exports = statusCheckAction;
