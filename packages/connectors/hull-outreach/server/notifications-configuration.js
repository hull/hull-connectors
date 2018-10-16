const _ = require("lodash");

const SyncAgent = require("./lib/sync-agent");

module.exports = {
  "user:update": (ctx, messages) => {
    if (ctx.smartNotifierResponse) {
      ctx.smartNotifierResponse.setFlowControl({
        type: "next",
        size: parseInt(process.env.FLOW_CONTROL_SIZE, 10) || 100,
        in: parseInt(process.env.FLOW_CONTROL_IN, 10) || 10,
        in_time: parseInt(process.env.FLOW_CONTROL_IN_TIME, 10) || 10
      });
    }
    const syncAgent = new SyncAgent(ctx);
    return syncAgent.sendUserMessages(messages);
  },
  "account:update": (ctx, messages) => {
    const syncAgent = new SyncAgent(ctx);
    return syncAgent.sendAccountMessages(messages);
  }
};
