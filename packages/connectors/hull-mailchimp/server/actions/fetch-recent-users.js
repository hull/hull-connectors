// @flow
import type { HullContext } from "hull";

/**
 *  Trigger a job for importing recently updated contacts in Mailchimp
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
