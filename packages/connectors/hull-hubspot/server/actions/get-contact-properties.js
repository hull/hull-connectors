/* @flow */
import type { HullContext } from "hull";

const SyncAgent = require("../lib/sync-agent");

function getContactProperties(ctx: HullContext) {
  const syncAgent = new SyncAgent(ctx);

  return syncAgent.getContactProperties();
}

module.exports = getContactProperties;
