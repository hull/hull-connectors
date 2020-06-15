/* @flow */
import type {
  HullContext,
  HullNotificationResponse,
  HullUserUpdateMessage
} from "hull";

const SyncAgent = require("../lib/sync-agent");

export default async (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse => {
  try {
    const syncAgent = new SyncAgent(ctx);
    await syncAgent.sendUserMessages(messages);
    return {};
  } catch (err) {
    return {
      flow_control: { type: "retry" }
    };
  }
};
