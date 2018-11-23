/* @flow */
import type { HullContext } from "hull";

const SyncAgent = require("../lib/sync-agent");

/**
 * Handles operation for automatic sync changes of hubspot profiles
 * to hull users.
 */
function fetchAction(ctx: HullContext) {
  const syncAgent = new SyncAgent(ctx);
  syncAgent.fetchRecentContacts();
  return Promise.resolve("ok");
}

module.exports = fetchAction;
