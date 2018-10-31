const SyncAgent = require("../lib/sync-agent");

function fetchAllAction(ctx) {
  const syncAgent = new SyncAgent(ctx);
  return syncAgent.fetchAllContacts();
}

module.exports = fetchAllAction;
