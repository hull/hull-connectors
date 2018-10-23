/* @flow */
const Promise = require("bluebird");

function shipUpdateHandler(ctx: any) {
  const { syncAgent } = ctx.shipApp;
  if (!syncAgent.isConfigured()) {
    ctx.client.logger.error("connector.configuration.error", {
      errors: "connector not configured"
    });
    return Promise.resolve();
  }

  return syncAgent.syncConnector({ forceCheck: true });
}

module.exports = shipUpdateHandler;
