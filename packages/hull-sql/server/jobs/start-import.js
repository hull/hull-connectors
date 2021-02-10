/* @flow */
import SyncAgent from "../lib/sync-agent";

const startImportJob = adapter => (ctx: any) =>
  new SyncAgent(ctx, adapter).startImport();

export default startImportJob;
