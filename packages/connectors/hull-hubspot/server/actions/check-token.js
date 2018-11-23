const SyncAgent = require("../lib/sync-agent");

function checkTokenAction(ctx) {
  const syncAgent = new SyncAgent(ctx);
  syncAgent.checkToken();
  return Promise.resolve("ok");
}

module.exports = checkTokenAction;
