const SyncAgent = require("../lib/sync-agent");

async function getForms(ctx) {
  try {
    const syncAgent = new SyncAgent(ctx);
    const options = await syncAgent.getForms();
    return {
      status: 200,
      data: {
        options
      }
    };
  } catch (err) {
    ctx.client.logger.error("getforms.error", err);
    return {
      status: 500,
      data: {
        options: []
      }
    };
  }
}

module.exports = getForms;
