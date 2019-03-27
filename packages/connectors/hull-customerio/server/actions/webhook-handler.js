/* @flow */
import type { HullRequest, HullResponse } from "hull";

const SyncAgent = require("../lib/sync-agent");

function webhookHandler(req: HullRequest, res: HullResponse): Promise<any> {
  res.send();

  const syncAgent = new SyncAgent(req.hull);
  return syncAgent.handleWebhook(req.body);
}

module.exports = webhookHandler;
