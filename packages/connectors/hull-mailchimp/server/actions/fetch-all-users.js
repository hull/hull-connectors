// @flow
import type { HullContext } from "hull";

const createMemberBatch = require("./batch/create-member-batch");

async function fetchAllUsers(ctx: HullContext) {
  await ctx.enqueue("syncOut");

  return createMemberBatch(ctx);
}

module.exports = fetchAllUsers;
