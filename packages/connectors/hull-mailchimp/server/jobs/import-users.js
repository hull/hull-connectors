/* @flow */

const { importUsers } = require("../actions/batch/batch-actions");

const shipAppFactor = require("../lib/ship-app-factory");

function importUsersJob(ctx: any, payload: any) {
  const { syncAgent } = shipAppFactor(ctx);
  const members = payload.response || [];
  ctx.client.logger.debug("incoming.users.start", members.length);
  return importUsers({ syncAgent, entities: members });
}

module.exports = importUsersJob;
