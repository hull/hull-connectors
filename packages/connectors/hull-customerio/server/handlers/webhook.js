/* @flow */
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";

const SyncAgent = require("../lib/sync-agent");

function webhookHandler(
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse {
  const syncAgent = new SyncAgent(ctx);
  syncAgent.handleWebhook(message.body);
  return {
    status: 200
  };
}

module.exports = webhookHandler;
