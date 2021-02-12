/* @flow */
import { Connector } from "hull";

import SyncAgent from "../lib/sync-agent";

export default function workerJobs(connector: Connector): Connector {
  connector.worker({
    startSync: function startSyncWrapper(ctx) {
      ctx.job = this;
      const agent = new SyncAgent(ctx);
      return agent.startSync();
    },
    startImport: function startImportWrapper(ctx) {
      ctx.job = this;
      const agent = new SyncAgent(ctx);
      return agent.startImport();
    }
  });
  return connector;
}
