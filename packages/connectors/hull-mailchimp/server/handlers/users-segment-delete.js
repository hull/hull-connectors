/* @flow */
import type { HullContext, HullSegmentDeleteMessage } from "hull";
import shipAppFactory from "../lib/ship-app-factory";

function segmentDeleteHandler(
  ctx: HullContext,
  message: HullSegmentDeleteMessage
) {
  const { syncAgent } = shipAppFactory(ctx);
  if (!syncAgent.isConfigured()) {
    ctx.client.logger.error("connector.configuration.error", {
      errors: "connector not configured"
    });
    return Promise.resolve();
  }
  return Promise.all([
    syncAgent.segmentsMappingAgent
      .deleteSegment(message)
      .then(() => syncAgent.segmentsMappingAgent.updateMapping()),
    syncAgent.interestMappingAgent
      .deleteInterest(message)
      .then(() => syncAgent.interestMappingAgent.updateMapping())
  ]);
}

module.exports = segmentDeleteHandler;
