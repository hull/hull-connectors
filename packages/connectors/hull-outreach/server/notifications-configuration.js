const SyncAgent = require("./lib/sync-agent");

module.exports = {
  "user:update": (ctx, messages) => {
    const syncAgent = new SyncAgent(ctx);
    return syncAgent.sendUserMessages(messages);
  },
  "account:update": (ctx, messages) => {
    const syncAgent = new SyncAgent(ctx);
    return syncAgent.sendAccountMessages(messages);
  }
};
