// @flow
import type { HullContext } from "hull/src/types/context";
import type { HullExternalResponse } from "hull";

const IntercomClient = require("../lib/intercom-client");
const IntercomAgent = require("../lib/intercom-agent");
const SyncAgent = require("../lib/sync-agent/sync-agent");

async function fetchRecentUsers(ctx: HullContext): HullExternalResponse {
  const intercomClient = new IntercomClient(ctx);
  const intercomAgent = new IntercomAgent(intercomClient, ctx);
  const syncAgent = new SyncAgent(intercomAgent, ctx);

  await syncAgent.fetchRecentUsers({ count: 50, page: 1 });
  return {
    status: 200,
    data: {
      status: "ok"
    }
  };
}

module.exports = fetchRecentUsers;
