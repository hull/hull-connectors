// @flow
import type { HullContext } from "hull";
import executeBatchJob from "./execute-batch-job";

const _ = require("lodash");

export default async function importMemberBatch(ctx: HullContext) {
  const importType = "member";
  const jobName = "importUsers";
  const batchLock = await ctx.cache.get("member_batch_lock");

  if (!_.isNil(batchLock)) {
    return {
      status: 200,
      data: {
        message: "Import already initiated"
      }
    };
  }

  const batchId = await ctx.cache.get("member_batch_id");
  if (_.isNil(batchId)) {
    return {
      status: 200,
      data: {
        message: "No active batch to import"
      }
    };
  }

  await ctx.cache.set("member_batch_lock", true, { ttl: 0 });
  return executeBatchJob(ctx, {
    jobName,
    batchId,
    importType
  });
}
