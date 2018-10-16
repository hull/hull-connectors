/* @flow */
import type { TReqContext, THullAccountUpdateMessage } from "hull";

const SyncAgent = require("../lib/sync-agent");
const Promise = require("bluebird");

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
