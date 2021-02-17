/* @flow */
import type { HullContext, HullExternalResponse } from "hull";
import SyncAgent from "../lib/sync-agent";

const sync = adapter => {
  return (ctx: HullContext): HullExternalResponse => {
    const agent = new SyncAgent(ctx, adapter);

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
  };
};

export default sync;
