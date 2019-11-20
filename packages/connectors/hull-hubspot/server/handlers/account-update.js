// @flow

import type { HullContext, HullAccountUpdateMessage } from "hull";
import SyncAgent from "../lib/sync-agent";

export default async (
  ctx: HullContext,
  messages: Array<HullAccountUpdateMessage>
) => {
  const syncAgent = new SyncAgent(ctx);
  await syncAgent.sendAccountUpdateMessages(messages);
  return {
    flow_control: {
      type: "next",
      size: parseInt(process.env.FLOW_CONTROL_SIZE, 10) || 10,
      in: parseInt(process.env.FLOW_CONTROL_IN, 10) || 5,
      in_time: parseInt(process.env.FLOW_CONTROL_IN_TIME, 10) || 10
    }
  };
};
