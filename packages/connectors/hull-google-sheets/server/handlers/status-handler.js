// @flow
// import _ from "lodash";
import type { HullStatusResponse, HullContext } from "hull";

export default async function statusHandler(
  _ctx: HullContext
): HullStatusResponse {
  // const { _connector, client } = ctx;
  return {
    status: "ok",
    messages: []
  };
}
