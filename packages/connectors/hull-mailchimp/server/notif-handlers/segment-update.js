/* @flow */
const Promise = require("bluebird");

/**
 * When segment is added or updated make sure its in the segments mapping,
 * and trigger an extract for that segment to update users.
 */
function segmentUpdateHandler(ctx: any, segment: Object) {
  ctx.client.logger.debug(
    "[segmentUpdateHandler] start",
    JSON.stringify({ segment })
  );

  const { syncAgent } = ctx.shipApp;

  if (!syncAgent.isConfigured()) {
    ctx.client.logger.error("connector.configuration.error", {
      errors: "connector not configured"
    });

    ctx.client.logger.debug("[segmentUpdateHandler] ship not configured");
    return Promise.resolve();
  }

  return syncAgent.syncConnector({ forceCheck: true });
}

module.exports = segmentUpdateHandler;
