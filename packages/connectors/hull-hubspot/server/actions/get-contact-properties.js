/* @flow */
import type { HullContext, HullExternalResponse } from "hull";

const SyncAgent = require("../lib/sync-agent");

const getContactProperties = (direction: string) => async (
  ctx: HullContext
): HullExternalResponse => {
  const syncAgent = new SyncAgent(ctx);
  const data = await syncAgent.getContactProperties(direction);
  return {
    status: 200,
    data
  };
};

module.exports = getContactProperties;
