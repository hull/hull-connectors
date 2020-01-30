// @flow

import type {
  HullContext,
  HullNotificationResponse,
  HullUserUpdateMessage
} from "hull";
import SyncAgent from "../lib/sync-agent";

export default async (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse => {
  // if (ctx.smartNotifierResponse) {
  //   ctx.smartNotifierResponse.setFlowControl();
  // }
  try {
    const syncAgent = new SyncAgent(ctx);
    await syncAgent.sendUserUpdateMessages(messages);
    return {};
  } catch (err) {
    return {
      flow_control: { type: "retry" }
    };
  }
};
