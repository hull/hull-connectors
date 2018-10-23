/* @flow */
const Promise = require("bluebird");

const shipAppFactory = require("../lib/ship-app-factory");

function shipUpdateHandler(ctx: any) {
  const { syncAgent } = shipAppFactory(ctx);
  if (!syncAgent.isConfigured()) {
    ctx.client.logger.error("connector.configuration.error", {
      errors: "connector not configured"
    });
    return Promise.resolve();
  }

  return syncAgent.syncConnector({ forceCheck: true });
}

module.exports = shipUpdateHandler;
