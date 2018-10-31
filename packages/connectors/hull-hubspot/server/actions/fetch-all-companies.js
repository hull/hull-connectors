const SyncAgent = require("../lib/sync-agent");

function fetchAllCompaniesAction(ctx) {
  const syncAgent = new SyncAgent(ctx);
  return syncAgent.fetchAllCompanies();
}

module.exports = fetchAllCompaniesAction;
