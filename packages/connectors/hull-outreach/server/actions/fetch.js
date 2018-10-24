/* @flow */
import type { $Response } from "express";

const SyncAgent = require("../lib/sync-agent");

function fetchAction(ctx) {
  const syncAgent = new SyncAgent(ctx);

  syncAgent.fetchOutreachAccounts().then(() => {
    return syncAgent.fetchOutreachProspects();
  });
  return Promise.resolve("ok");
}

module.exports = fetchAction;
