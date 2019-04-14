/* @flow */
import type { HullContext, HullExternalResponse } from "hull";

/**
 * Queue SyncOut and SyncIn jobs here. We cannot guarantee the order
 * of these operations to be finished since both of them include
 * requesting userbase extract from Hull API and Mailchimp API.
 */
async function sync(ctx: HullContext): HullExternalResponse {
  await Promise.all([ctx.enqueue("syncOut"), ctx.enqueue("fetchAllUsers")]);
  // @TODO Check with Michal if we can use a HullStatusResponse instead.
  return {
    status: 200,
    data: {
      status: "ok"
    }
  };
}

module.exports = sync;
