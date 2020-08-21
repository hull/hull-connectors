/* @flow */
import type { HullContext } from "hull";

const IntercomClient = require("../lib/intercom-client");
const IntercomAgent = require("../lib/intercom-agent");
const SyncAgent = require("../lib/sync-agent/sync-agent");

function fetchSegments(ctx: HullContext) {
  const intercomClient = new IntercomClient(ctx);
  const intercomAgent = new IntercomAgent(intercomClient, ctx);
  const syncAgent = new SyncAgent(intercomAgent, ctx);

  const segments = syncAgent.fetchSegments();
  return {
    status: 200,
    data: {
      segments
    }
  };
}

module.exports = fetchSegments;
