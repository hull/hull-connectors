// @flow
import type { HullContext } from "hull";

const _ = require("lodash");

const operationName = "fetch_recent_users";

/**
 *  Trigger a job for importing recently updated contacts in Mailchimp
 */
async function fetchRecentUsers(ctx: HullContext) {
  const { connector = {} } = ctx;
  const { private_settings = {} } = connector;
  let response;
  if (_.isNil(private_settings[`${operationName}_batch_id`])) {
    response = "ok";
    await ctx.enqueue("fetchRecentUsers", { operationName });
  } else {
    response = `Sync operation already running with batch id: ${
      private_settings[`${operationName}_batch_id`]
    }. Please wait for the previous one to finish.`;
  }
  return {
    status: 200,
    data: {
      response
    }
  };
}

module.exports = fetchRecentUsers;
