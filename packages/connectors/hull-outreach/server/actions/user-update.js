/* @flow */
import type { TReqContext, THullUserUpdateMessage } from "hull";

const Promise = require("bluebird");
const SyncAgent = require("../lib/sync-agent");

function userUpdate(
  ctx: TReqContext,
  messages: Array<THullUserUpdateMessage>
): Promise<*> {
  const syncAgent = new SyncAgent(ctx);
  return syncAgent.sendUserMessages(messages).catch(err => {
    console.error(">>>> ERROR <<<<", err); // TODO: Add logger
  });
}

module.exports = userUpdate;
