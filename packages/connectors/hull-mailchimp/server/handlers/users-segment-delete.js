/* @flow */
import type {
  HullContext,
  HullSegmentDeleteMessage,
  HullNotificationResponse
} from "hull";
import shipAppFactory from "../lib/ship-app-factory";

async function segmentDeleteHandler(
  ctx: HullContext,
  message: HullSegmentDeleteMessage
): HullNotificationResponse {
  const { syncAgent } = shipAppFactory(ctx);
  if (!syncAgent.isConfigured()) {
    ctx.client.logger.error("connector.configuration.error", {
      errors: "connector not configured"
    });
    return Promise.resolve();
  }
  await Promise.all([
    syncAgent.segmentsMappingAgent
      .deleteSegment(message)
      .then(() => syncAgent.segmentsMappingAgent.updateMapping()),
    syncAgent.interestsMappingAgent
      .deleteInterest(message)
      .then(() => syncAgent.interestsMappingAgent.updateMapping())
  ]);
  return {};
}

module.exports = segmentDeleteHandler;
