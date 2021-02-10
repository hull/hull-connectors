/* @flow */
import type { HullContext, HullExternalResponse } from "hull";
import _ from "lodash";
import SyncAgent from "../lib/sync-agent";

const run = adapter => {
  return async (ctx: HullContext): HullExternalResponse => {
    const { preview_timeout } = ctx.connectorConfig;
    const agent = new SyncAgent(ctx, adapter);

    if (!agent.areConnectionParametersConfigured()) {
      agent.hull.logger.error("connection string not configured");
      return {
        status: 403,
        data: {
          message: "connection parameters not configured"
        }
      };
    }

    const query = await agent.getQuery(_.get(ctx, "notification.query"));
    if (!query) {
      return {
        status: 403,
        data: {
          status: "query string empty"
        }
      };
    }

    try {
      const data = await agent.runQuery(query, {
        timeout: parseInt(preview_timeout, 10),
        limit: 100
      });
      return {
        status: 200,
        data
      };
    } catch (error) {
      const { message } = error;
      return {
        status: 500,
        data: {
          message
        }
      };
    }
  };
};

export default run;
