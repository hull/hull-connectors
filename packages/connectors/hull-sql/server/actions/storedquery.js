/* @flow */
import type { HullContext, HullExternalResponse } from "hull";
import SyncAgent from "../lib/sync-agent";

async function storedquery(ctx: HullContext): HullExternalResponse {
  const agent = new SyncAgent(ctx);

  if (!agent.areConnectionParametersConfigured()) {
    agent.hull.logger.error("connection string not configured");
    return {
      status: 403,
      data: {
        message: "connection parameters not configured"
      }
    };
  }
  const query = agent.getQuery();
  return {
    data: query
  };
}

module.exports = storedquery;
