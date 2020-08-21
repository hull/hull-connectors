// @flow

import type { HullContext } from "hull";

const Promise = require("bluebird");
const IntercomClient = require("../lib/intercom-client");
const IntercomAgent = require("../lib/intercom-agent");
const SyncAgent = require("../lib/sync-agent/sync-agent");

async function userSegmentDelete(ctx: HullContext) {
  try {
    const intercomClient = new IntercomClient(ctx);
    const intercomAgent = new IntercomAgent(intercomClient, ctx);
    const syncAgent = new SyncAgent(intercomAgent, ctx);

    if (!syncAgent.isConfigured()) {
      ctx.client.logger.error("connector.configuration.error", {
        errors: "connector is not configured"
      });
      return Promise.resolve();
    }

    await syncAgent.syncShip();
    return {
      flow_control: { type: "next", size: 1, in: 1 }
    };
  } catch (err) {
    return Promise.resolve();
  }
}

module.exports = userSegmentDelete;
