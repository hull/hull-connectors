const SyncAgent = require("./lib/sync-agent");

module.exports = {
  "user:update": (ctx, messages = []) => {
    if (ctx.smartNotifierResponse) {
      // Get 10 users every 100ms at most.
      ctx.smartNotifierResponse.setFlowControl({
        type: "next",
        size: parseInt(process.env.FLOW_CONTROL_USER_SIZE, 10) || 100,
        in: parseInt(process.env.FLOW_CONTROL_USER_IN, 10) || 10,
        in_time: parseInt(process.env.FLOW_CONTROL_USER_IN_TIME, 10) || 1000
      });
    }
    const syncAgent = new SyncAgent(ctx);
    if (messages.length > 0) {
      return syncAgent.sendUserUpdateMessages(messages);
    }
    return Promise.resolve();
  },
  "account:update": (ctx, messages = []) => {
    if (ctx.smartNotifierResponse) {
      ctx.smartNotifierResponse.setFlowControl({
        type: "next",
        size: parseInt(process.env.FLOW_CONTROL_ACCOUNT_SIZE, 10) || 10,
        in: parseInt(process.env.FLOW_CONTROL_ACCOUNT_IN, 10) || 10,
        in_time: parseInt(process.env.FLOW_CONTROL_ACCOUNT_IN_TIME, 10) || 1000
      });
    }
    const syncAgent = new SyncAgent(ctx);

    if (messages.length > 0) {
      return syncAgent.sendAccountUpdateMessages(messages);
    }

    return Promise.resolve();
  }
};
