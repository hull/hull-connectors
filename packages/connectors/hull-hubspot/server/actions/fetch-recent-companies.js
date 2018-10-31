/* @flow */
import type { HullContext } from "hull";

const SyncAgent = require("../lib/sync-agent");

/**
 * Handles operation for automatic sync changes of hubspot profiles
 * to hull users.
 */
function fetchRecentCompaniesAction(ctx: HullContext) {
  const syncAgent = new SyncAgent(ctx);
  return syncAgent.fetchRecentCompanies();
}

module.exports = fetchRecentCompaniesAction;
