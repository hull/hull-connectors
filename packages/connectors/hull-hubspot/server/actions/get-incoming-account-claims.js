/* @flow */
import type { HullContext } from "hull";

const SyncAgent = require("../lib/sync-agent");

function getIncomingAccountClaims(ctx: HullContext) {
  const syncAgent = new SyncAgent(ctx);

  return syncAgent.getIncomingAccountClaims();
}

module.exports = getIncomingAccountClaims;
