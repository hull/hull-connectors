const SyncAgent = require("../lib/sync-agent");

function refreshAccessToken(ctx) {
  const syncAgent = new SyncAgent(ctx);
  return syncAgent.refreshAccessToken();
}

module.exports = refreshAccessToken;
