/* @flow */
import type { HullContext, HullExternalResponse } from "hull";
import SyncAgent from "../lib/sync-agent";

async function importResults(ctx: HullContext): HullExternalResponse {
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

  if (!agent.isQueryStringConfigured()) {
    agent.hull.logger.error("query string not configured");
    return {
      status: 403,
      data: {
        message: "query string not configured"
      }
    };
  }

  ctx.enqueue("startImport");

  return { status: 200, data: "scheduled" };
}

module.exports = importResults;
