/* @flow */
import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";

const FacebookAudience = require("../lib/facebook-audience");

async function userUpdateBatch(
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse {
  const { options, ship, client, helpers, segments, metric } = ctx;
  const { audience } = options;
  const users = messages.map(m => m.user);
  const fb = new FacebookAudience(ship, client, helpers, segments, metric);
  if (audience && users) {
    await fb.addUsersToAudience(audience, users);
  }
  return {
    status: 200
  };
}

module.exports = userUpdateBatch;
