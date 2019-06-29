/* @flow */
import type { HullContext, HullExternalResponse } from "hull";

const SyncAgent = require("../lib/sync-agent");

/**
 * Handles operation for automatic sync changes of hubspot profiles
 * to hull users.
 */
async function fetchRecentCompaniesAction(
  ctx: HullContext
): HullExternalResponse {
  const syncAgent = new SyncAgent(ctx);
  const data = await syncAgent.fetchRecentCompanies();
  return {
    status: 200,
    data
  };
}

module.exports = fetchRecentCompaniesAction;
