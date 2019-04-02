/* @flow */
import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";

const SyncAgent = require("../lib/sync-agent");

async function updateUser(
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse {
  const syncAgent = new SyncAgent(ctx);
  try {
    await syncAgent.sendUserMessages(messages);
    return {
      status: 200
    };
  } catch (err) {
    console.error(">>>> ERROR <<<<", err);
    return {
      status: 200
    };
  }
}

module.exports = updateUser;
