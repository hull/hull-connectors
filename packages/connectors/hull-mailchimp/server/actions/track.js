/* @flow */
import type { HullContext } from "hull";

const _ = require("lodash");

const operationName = "track";

async function track(ctx: HullContext) {
  const { connector = {} } = ctx;
  const { private_settings = {} } = connector;
  let response;
  if (_.isNil(private_settings[`${operationName}_batch_id`])) {
    response = "ok";
    await ctx.enqueue("track", { operationName });
  } else {
    response = `Track operation already running with batch id: ${
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

module.exports = track;
