// @flow

import type { HullContext, HullAccountUpdateMessage } from "hull";
import SyncAgent from "../lib/sync-agent";

export default async (
  ctx: HullContext,
  messages: Array<HullAccountUpdateMessage>
) => {
  const syncAgent = new SyncAgent(ctx);
  await syncAgent.sendAccountUpdateMessages(messages);
  return {};
};
