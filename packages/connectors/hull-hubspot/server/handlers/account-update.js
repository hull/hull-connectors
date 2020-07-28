// @flow

import type { HullContext, HullAccountUpdateMessage } from "hull";
import SyncAgent from "../lib/sync-agent";

export default async (
  ctx: HullContext,
  messages: Array<HullAccountUpdateMessage>
) => {
  try {
    const syncAgent = new SyncAgent(ctx);
    await syncAgent.sendAccountUpdateMessages(messages);
    return {};
  } catch (err) {
    return {
      flow_control: { type: "retry" }
    };
  }
