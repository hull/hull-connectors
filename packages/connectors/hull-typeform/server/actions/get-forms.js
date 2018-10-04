const SyncAgent = require("../lib/sync-agent");

function getForms(ctx) {
  const syncAgent = new SyncAgent(ctx);
  return syncAgent.getForms();
}

module.exports = getForms;
