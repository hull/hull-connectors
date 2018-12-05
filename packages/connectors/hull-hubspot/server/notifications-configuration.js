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
    return syncAgent.sendUserUpdateMessages(messages);
  },
  "account:update": (ctx, messages) => {
    const syncAgent = new SyncAgent(ctx);
    return syncAgent.sendAccountUpdateMessages(messages);
  },
  "ship:update": ctx => {
    if (ctx.smartNotifierResponse) {
      ctx.smartNotifierResponse.setFlowControl({
        type: "next",
        size: 1,
        in: 1
      });
    }
    const syncAgent = new SyncAgent(ctx);
    return syncAgent.syncConnector();
  },
  "users_segment:update": ctx => {
    if (ctx.smartNotifierResponse) {
      ctx.smartNotifierResponse.setFlowControl({
        type: "next",
        size: 1,
        in: 1
      });
    }
    const syncAgent = new SyncAgent(ctx);
    return syncAgent.syncConnector();
  },
  "accounts_segment:update": (ctx, messages) => {
    if (ctx.smartNotifierResponse) {
      ctx.smartNotifierResponse.setFlowControl({
        type: "next",
        size: 1,
        in: 1
      });
    }
    // FIXME: due to the fact the segments lists may be or may not be updated we need
    // to make sure that we have the new segment there
    ctx.accountsSegments = _.uniqBy(
      ctx.accountsSegments.concat(messages),
      "id"
    );
    const syncAgent = new SyncAgent(ctx);
    return syncAgent.syncConnector();
  }
};
