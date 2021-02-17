/* @flow */
import type { HullContext, HullExternalResponse } from "hull";

const SyncAgent = require("../lib/sync-agent");

const getLeadAssignmentRules = async (
  ctx: HullContext
): HullExternalResponse => {
  const syncAgent = new SyncAgent(ctx);
  const data = await syncAgent.fetchLeadAssignmentRules();
  return {
    status: 200,
    data
  };
};

module.exports = getLeadAssignmentRules;
