// @flow

import type { HullContext } from "hull";
import SyncAgent from "../lib/sync-agent";

export default async (ctx: HullContext) => {
  const syncAgent = new SyncAgent(ctx);
  await syncAgent.syncConnector();
  return {
    flow_control: { type: "next" }
  };
};
