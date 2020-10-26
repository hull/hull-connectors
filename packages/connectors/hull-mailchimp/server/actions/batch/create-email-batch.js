/* @flow */
const _ = require("lodash");
const shipAppFactory = require("../../lib/ship-app-factory");

async function createEmailBatch(ctx: any) {
  const importType = "email";
  const { syncAgent, mailchimpAgent } = shipAppFactory(ctx);
  const batch_id = await mailchimpAgent.cache.get("email_batch_id");
  if (!_.isNil(batch_id)) {
    const message = `Track Email Batch {${batch_id}} Already Initiated`;
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

  return syncAgent.eventsAgent
    .getCampaignsAndAutomationsToTrack()
    .then(async campaigns => {
      const operations = syncAgent.eventsAgent.getEmailActivitiesOps(campaigns);
      const batchJob = await mailchimpAgent.batchAgent.create({
        operations,
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
      await mailchimpAgent.cache.set("email_batch_id", batchJob.id, {
        ttl: 0
      });

      return {
        status: 200,
        data: {
          importType,
          batchId: batchJob.id
        }
      };
    });
}

module.exports = createEmailBatch;
