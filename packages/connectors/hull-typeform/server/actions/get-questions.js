const SyncAgent = require("../lib/sync-agent");

async function getQuestions(ctx) {
  try {
    const syncAgent = new SyncAgent(ctx);
    const options = await syncAgent.getQuestions();
    return {
      status: 200,
      data: {
        options
      }
    };
  } catch (err) {
    ctx.client.logger.error("getquestions.error", err);
    return {
      status: 500,
      data: {
        options: []
      }
    };
  }
}

module.exports = getQuestions;
