/* @flow */
import type { HullContext, HullExternalResponse } from "hull";

const _ = require("lodash");

const operationName = "sync";

/**
 * Queue SyncOut and SyncIn jobs here. We cannot guarantee the order
 * of these operations to be finished since both of them include
 * requesting userbase extract from Hull API and Mailchimp API.
 */
async function sync(ctx: HullContext): HullExternalResponse {
  const { connector = {} } = ctx;
  const { private_settings = {} } = connector;
  let response;
  if (_.isNil(private_settings[`${operationName}_batch_id`])) {
    await ctx.enqueue("fetchAllUsers", { operationName });
    response = "ok";
  } else {
    response = `Sync operation already running with batch id: ${
      private_settings[`${operationName}_batch_id`]
    }. Please wait for the previous one to finish.`;
  }
  // @TODO Check with Michal if we can use a HullStatusResponse instead.
  return {
    status: 200,
    data: {
      response
    }
  };
}

module.exports = sync;
