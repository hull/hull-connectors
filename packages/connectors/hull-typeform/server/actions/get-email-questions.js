const SyncAgent = require("../lib/sync-agent");

async function getEmailQuestions(ctx) {
  try {
    const syncAgent = new SyncAgent(ctx);
    const options = await syncAgent.getQuestions({ type: "email" });
    return {
      status: 200,
      data: {
        options
      }
    };
  } catch (err) {
    ctx.client.logger.error("getemailquestions.error", err);
    return {
      status: 500,
      data: {
        options: []
      }
    };
  }
}

module.exports = getEmailQuestions;
