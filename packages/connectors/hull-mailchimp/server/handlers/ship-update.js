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

  try {
    return syncAgent.syncConnector({ forceCheck: true });
  } catch (error) {
    ctx.client.logger.error("connector.sync.error", {
      error: error.message,
      message: "Unable to sync connector"
    });
    return Promise.resolve();
  }
}

module.exports = shipUpdateHandler;
