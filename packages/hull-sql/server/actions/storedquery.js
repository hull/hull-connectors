/* @flow */
import type { HullContext, HullExternalResponse } from "hull";
import SyncAgent from "../lib/sync-agent";

const storedquery = adapter => {
  return (ctx: HullContext): HullExternalResponse => {
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
    const query = agent.getQuery();
    return {
      data: query
    };
  };
};

export default storedquery;
