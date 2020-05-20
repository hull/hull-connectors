/* @flow */
import SyncAgent from "../lib/sync-agent";

function startImportJob(ctx: any) {
  const agent = new SyncAgent(ctx);
  return agent.startImport();
}

module.exports = startImportJob;
