/* @flow */
import type { HullContext, HullUserUpdateMessage } from "hull";

const Promise = require("bluebird");
const SyncAgent = require("../lib/sync-agent");

function updateUser(
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): Promise<*> {
  const syncAgent = new SyncAgent(ctx);
  return syncAgent.sendUserMessages(messages).catch(err => {
    console.error(">>>> ERROR <<<<", err);
  });
}

module.exports = updateUser;
