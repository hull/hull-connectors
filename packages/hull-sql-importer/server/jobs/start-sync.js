/* @flow */
import SyncAgent from "../lib/sync-agent";

const startSyncJob = adapter => {
  return (ctx: any) => {
    const agent = new SyncAgent(ctx, adapter);

    if (!agent.isEnabled()) {
      return {
        status: 200,
        data: {
          message: "Connector Sync Disabled"
        }
      };
    }

    return agent.startSync();
  };
};

export default startSyncJob;
