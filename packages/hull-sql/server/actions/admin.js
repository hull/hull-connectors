// @flow
import type { HullContext, HullExternalResponse } from "hull";
import SyncAgent from "../lib/sync-agent";

const admin = adapter => {
  return (ctx: HullContext): HullExternalResponse => {
    const { preview_timeout, manifest } = ctx.connectorConfig;
    const { private_settings } = ctx.connector;
    const agent = new SyncAgent(ctx, adapter);
    if (agent.areConnectionParametersConfigured()) {
      const query = agent.getQuery();

      return {
        pageLocation: "../../../hull-sql/views/connected.html",
        data: {
          query,
          preview_timeout,
          last_sync_at: null,
          import_type: "users",
          db_type: manifest.source,
          ...private_settings
        }
      };
    }
    return {
      pageLocation: "../../../hull-sql/views/home.html",
      data: {
        connector_name: manifest.name
      }
    };
  };
};

export default admin;
