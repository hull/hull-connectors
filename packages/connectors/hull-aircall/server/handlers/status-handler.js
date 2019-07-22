// @flow
import type { HullContext, HullStatusResponse } from "hull";

export default async function statusCheck(
  _ctx: HullContext
): HullStatusResponse {
  return { messages: [], status: "ok" };
}
