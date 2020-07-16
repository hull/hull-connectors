// @flow
import type { HullContext } from "hull";

/**
 * Fetch the most recent contact changes in Mailchimp. No later than 24 hours.
 * @param ctx
 * @returns {*}
 */
async function fetchRecentUsers(ctx: HullContext) {
  ctx.enqueue("fetchRecentUsers");
  return {
    status: 200,
    data: {
      status: "ok"
    }
  };
}

module.exports = fetchRecentUsers;
