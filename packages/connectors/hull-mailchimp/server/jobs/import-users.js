/* @flow */
import type { TMailchimpCurrentMember } from "../lib/types";

const shipAppFactor = require("../lib/ship-app-factory");

function importUsersJob(ctx: any, payload: any) {
  const { syncAgent } = shipAppFactor(ctx);
  const members = payload.response || [];
  ctx.client.logger.debug("incoming.users.start", members.length);
  return members.map((member: TMailchimpCurrentMember) => {
    return syncAgent.userMappingAgent.updateUser(member);
  });
}

module.exports = importUsersJob;
