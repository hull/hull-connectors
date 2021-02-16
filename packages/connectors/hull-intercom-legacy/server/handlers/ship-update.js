// @flow

import type { HullContext } from "hull";

const SyncAgent = require("../lib/sync-agent/sync-agent");
const IntercomClient = require("../lib/intercom-client");
const IntercomAgent = require("../lib/intercom-agent");


// eslint-disable-next-line no-unused-vars
export default async (ctx: HullContext) => {
  const intercomClient = new IntercomClient(ctx);
  const intercomAgent = new IntercomAgent(intercomClient, ctx);
  const syncAgent = new SyncAgent(intercomAgent, ctx);

  try {
    await syncAgent.syncShip();
  } catch (e) {
    ctx.client.logger.info("ship.update.error", { error: e });
  }
  return {
    flow_control: { type: "next", size: 10, in_time: 10, in: 5 }
  };
};
