/* @flow */
import SyncAgent from "../lib/sync-agent";

const startSyncJob = adapter => {
  return (ctx: any) => {
    const agent = new SyncAgent(ctx, adapter);
    return agent.startSync();
  };
};

export default startSyncJob;
