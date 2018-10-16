/* @flow */
import type { TReqContext, THullAccountUpdateMessage } from "hull";

const Promise = require("bluebird");
const SyncAgent = require("../lib/sync-agent");

function accountUpdate(
  ctx: TReqContext,
  messages: Array<THullAccountUpdateMessage>
): Promise<*> {
  const syncAgent = new SyncAgent(ctx);
  return syncAgent.sendAccountMessages(messages).catch(err => {
    console.error(">>>> ERROR <<<<", err); // TODO: Add logger
  });
}

module.exports = accountUpdate;
