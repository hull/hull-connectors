/* @flow */
const _ = require("lodash");
const shipAppFactory = require("../../lib/ship-app-factory");

async function createMemberBatch(ctx: any) {
  const importType = "member";
  const { mailchimpAgent } = shipAppFactory(ctx);
  const batch_id = await mailchimpAgent.cache.get("member_batch_id");
  if (!_.isNil(batch_id)) {
    const message = `Import Member Batch {${batch_id}} Already Initiated`;
    ctx.client.logger.info("incoming.job.warning", {
      batchId: batch_id,
      message
    });
    return {
      status: 200,
      data: {
        message
      }
    };
  }

  const exclude = ["_links", "members._links"];
  const operation = {
    method: "GET",
    path: `/lists/${mailchimpAgent.listId}/members`,
    params: {
      exclude_fields: exclude.join(",")
    }
  };

  const batchJob = await mailchimpAgent.batchAgent.create({
    operations: [operation],
    importType
  });
  if (!batchJob.id) {
    return {
      status: 500,
      data: {
        importType,
        message: "Unable to create batch job"
      }
    };
  }

  await mailchimpAgent.cache.set("member_batch_id", batchJob.id, {
    ttl: 0
  });

  return {
    status: 200,
    data: {
      importType,
      batchId: batchJob.id
    }
  };
}

module.exports = createMemberBatch;
