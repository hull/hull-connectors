/* @flow */
import SyncAgent from "../lib/sync-agent";

const startSyncJob = adapter => (ctx: any) =>
  new SyncAgent(ctx, adapter).startSync();

export default startSyncJob;
