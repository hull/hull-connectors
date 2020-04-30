/* @flow */
import type { HullContext, HullExternalResponse } from "hull";
import SyncAgent from "../lib/sync-agent";

async function sync(ctx: HullContext): HullExternalResponse {
  const agent = new SyncAgent(ctx);

  if (!agent.areConnectionParametersConfigured()) {
    agent.hull.logger.error("incoming.job.error", {
      hull_summary:
        "connection string not configured, please update it or disable sync"
    });

    return {
      status: 403,
      data: {
        message: "connection parameters not configured"
      }
    };
  }

  if (!agent.isQueryStringConfigured()) {
    agent.hull.logger.error("incoming.job.error", {
      hull_summary:
        "query string not configured, please update it or disable sync"
    });
    return {
      status: 403,
      data: {
        message: "query string not configured"
      }
    };
  }

  ctx.enqueue("startSync");

  return {
    status: 200,
    data: {
      response: "ok"
    }
  };
}

module.exports = sync;
