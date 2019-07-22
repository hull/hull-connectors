/* @flow */
import type { HullContext, HullExternalResponse } from "hull";
/**
 * Queue SyncOut and SyncIn jobs here. We cannot guarantee the order
 * of these operations to be finished since both of them include
 * requesting userbase extract from Hull API and Mailchimp API.
 */
async function syncIn(ctx: HullContext): HullExternalResponse {
  await ctx.enqueue("syncIn");
  return {
    status: 200,
    data: {
      message: "Fetching Data, it might take a while"
    }
  };
}

module.exports = syncIn;
