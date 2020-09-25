// @flow
import type { HullContext, HullIncomingHandlerMessage } from "hull";
import executeBatchJob from "./execute-batch-job";

const _ = require("lodash");

export default async function importBatch(
  ctx: HullContext,
  incomingMessage: HullIncomingHandlerMessage
) {
  const batchData = _.get(incomingMessage, "body", {});
  const { batch_id, import_type } = batchData;

  if (!batch_id || !import_type) {
    return {
      status: 400,
      data: {
        message: "batch_id and import_type required"
      }
    };
  }

  if (import_type !== "email" && import_type !== "member") {
    return {
      status: 400,
      data: {
        message: "import_type must be 'email' or 'member'"
      }
    };
  }

  const batchLock = await ctx.cache.get(`${import_type}_batch_lock`);
  if (!_.isNil(batchLock)) {
    return {
      status: 200,
      data: {
        message: "Import already initiated"
      }
    };
  }

  await ctx.cache.set(`${import_type}_batch_lock`, true, { ttl: 0 });
  if (import_type === "email") {
    return executeBatchJob(ctx, {
      jobName: "trackEmailActivities",
      batchId: batch_id,
      importType: import_type
    });
  }

  if (import_type === "member") {
    return executeBatchJob(ctx, {
      jobName: "importUsers",
      batchId: batch_id,
      importType: import_type
    });
  }

  return {};
}
