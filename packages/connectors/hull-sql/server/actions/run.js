/* @flow */
import type { HullContext, HullExternalResponse } from "hull";
import SyncAgent from "../lib/sync-agent";

async function run(ctx: HullContext): HullExternalResponse {
  const { preview_timeout } = ctx.connectorConfig;
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

  const query = ctx.notification.query || agent.getQuery();
  if (!query) {
    return {
      status: 403,
      data: {
        status: "query string empty"
      }
    };
  }

  return agent
    .runQuery(query, { timeout: parseInt(preview_timeout, 10), limit: 100 })
    .then(data => {
      return {
        status: 200,
        data
      };
    })
    .catch(error => {
      const { message } = error;
      return {
        status: 500,
        data: {
          message
        }
      };
    });
}

module.exports = run;
