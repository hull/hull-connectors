/* @flow */
import type { HullContext, HullExternalResponse } from "hull";

const SyncAgent = require("../lib/sync-agent");

async function getIncomingAccountClaims(
  ctx: HullContext
): HullExternalResponse {
  const syncAgent = new SyncAgent(ctx);
  const data = await syncAgent.getIncomingAccountClaims();
  return {
    status: 200,
    data
  };
}

module.exports = getIncomingAccountClaims;
