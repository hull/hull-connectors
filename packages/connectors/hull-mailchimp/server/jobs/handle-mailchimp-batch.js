/* @flow */

const shipAppFactory = require("../lib/ship-app-factory");

/**
 * Parses the extract results and queues chunks for export operations
 * @return {Promise}
 * @param ctx
 * @param options
 */
function handleMailchimpBatch(ctx: any, options: any) {
  const { mailchimpAgent } = shipAppFactory(ctx);
  return mailchimpAgent.batchAgent.handle(options);
}

module.exports = handleMailchimpBatch;
