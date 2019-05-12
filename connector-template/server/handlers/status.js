// @flow
import type { HullContext, HullStatusResponse } from "hull";

export default async function statusCheck(
  ctx: HullContext
): HullStatusResponse {
  const { connector, client } = ctx;
  if (connector && client) {
    return {
      messages: [],
      status: "ok"
    };
  }
  return {
    messages: ["Can't find connector && client"],
    status: "error"
  };
}
