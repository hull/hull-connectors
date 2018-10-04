const SyncAgent = require("../lib/sync-agent");

function fetchAllResponses(ctx) {
  const syncAgent = new SyncAgent(ctx);
  // fire & forget
  syncAgent.fetchAllResponses();
  return Promise.resolve("ok");
}

module.exports = fetchAllResponses;
