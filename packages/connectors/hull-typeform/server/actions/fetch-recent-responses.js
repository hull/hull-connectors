const SyncAgent = require("../lib/sync-agent");

function fetchRecentResponses(ctx) {
  const syncAgent = new SyncAgent(ctx);
  return syncAgent.fetchRecentResponses();
}

module.exports = fetchRecentResponses;
