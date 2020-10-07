/* @flow */
const _ = require("lodash");
const createBatch = require("./execute-batch-creation");
const shipAppFactory = require("../../lib/ship-app-factory");

async function createMemberBatch(ctx: any) {
  const { syncAgent, mailchimpAgent } = shipAppFactory(ctx);
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

  const res = await createBatch({
    syncAgent,
    ctx,
    operations: [operation],
    importType: "member"
  });
  if (res.status === 200 && res.data.id) {
    await mailchimpAgent.cache.set("member_batch_id", res.data.id, {
      ttl: 0
    });
  }
  return res;
}

module.exports = createMemberBatch;
