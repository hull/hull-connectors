/* @flow */
import type { HullContext } from "hull";

const SyncAgent = require("../lib/sync-agent");

function getCompanyProperties(ctx: HullContext) {
  const syncAgent = new SyncAgent(ctx);

  return syncAgent.getCompanyProperties();
}

module.exports = getCompanyProperties;
