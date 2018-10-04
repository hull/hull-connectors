const SyncAgent = require("../lib/sync-agent");

function getEmailQuestions(ctx) {
  const syncAgent = new SyncAgent(ctx);
  return syncAgent.getQuestions({ type: "email" });
}

module.exports = getEmailQuestions;
