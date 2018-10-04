const SyncAgent = require("../lib/sync-agent");

function fetchRecentResponses(ctx) {
  const syncAgent = new SyncAgent(ctx);
  // fire & forget
  syncAgent.fetchRecentResponses();
  return Promise.resolve("ok");
}

module.exports = fetchRecentResponses;
