/* @flow */
import type { $Response } from "express";
import type { HullRequest } from "hull";

const SyncAgent = require("../lib/sync-agent");

function webhookHandler(req: HullRequest, res: $Response): Promise<any> {
  res.send();

  const syncAgent = new SyncAgent(req.hull);
  return syncAgent.handleWebhook(req.body);
}

module.exports = webhookHandler;
