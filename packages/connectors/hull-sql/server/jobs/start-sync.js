/* @flow */
import SyncAgent from "../lib/sync-agent";

function startSyncJob(ctx: any) {
  const agent = new SyncAgent(ctx);
  return agent.startSync();
}

module.exports = startSyncJob;
