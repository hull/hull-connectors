/* @flow */
const Promise = require("bluebird");

function segmentDeleteHandler(ctx: any, payload: any) {
  const { segment } = payload.message;
  const { syncAgent } = ctx.shipApp;
  if (!syncAgent.isConfigured()) {
    ctx.client.logger.error("connector.configuration.error", {
      errors: "connector not configured"
    });
    return Promise.resolve();
  }
  return Promise.all([
    syncAgent.segmentsMappingAgent
      .deleteSegment(segment)
      .then(() => syncAgent.segmentsMappingAgent.updateMapping()),
    syncAgent.interestMappingAgent
      .deleteInterest(segment)
      .then(() => syncAgent.interestMappingAgent.updateMapping())
  ]);
}

module.exports = segmentDeleteHandler;
