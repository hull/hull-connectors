// @flow
import type { HullExternalResponse, HullContext } from "hull";

const SyncAgent = require("../lib/sync-agent");

export default async function fetchAllResponses(
  ctx: HullContext
): HullExternalResponse {
  // fire & forget
  await new SyncAgent(ctx).fetchAllResponses();
  return {
    status: 200,
    data: {
      response: "ok"
    }
  };
}
