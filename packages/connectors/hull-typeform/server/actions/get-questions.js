const SyncAgent = require("../lib/sync-agent");

function getQuestions(ctx) {
  const syncAgent = new SyncAgent(ctx);
  return syncAgent.getQuestions();
}

module.exports = getQuestions;
