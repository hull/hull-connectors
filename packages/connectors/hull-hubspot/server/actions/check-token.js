const SyncAgent = require("../lib/sync-agent");

function checkTokenAction(ctx) {
  const syncAgent = new SyncAgent(ctx);
  return syncAgent.checkToken();
}

module.exports = checkTokenAction;
