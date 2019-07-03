/* @flow */
import type { HullContext, HullExternalResponse } from "hull";

const SyncAgent = require("../lib/sync-agent");

async function getContactProperties(ctx: HullContext): HullExternalResponse {
  const syncAgent = new SyncAgent(ctx);
  const data = await syncAgent.getContactProperties();
  return {
    status: 200,
    data
  };
}

module.exports = getContactProperties;
