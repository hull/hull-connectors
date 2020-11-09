/* @flow */
import SyncAgent from "../lib/sync-agent";

const startImportJob = adapter => {
  return (ctx: any) => {
    const agent = new SyncAgent(ctx, adapter);
    return agent.startImport();
  };
};

export default startImportJob;
