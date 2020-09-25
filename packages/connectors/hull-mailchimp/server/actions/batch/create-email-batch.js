/* @flow */
const _ = require("lodash");
const createBatch = require("./execute-batch-creation");
const shipAppFactory = require("../../lib/ship-app-factory");

async function createEmailBatch(ctx: any) {
  const { syncAgent, mailchimpAgent } = shipAppFactory(ctx);
  const batch_id = await mailchimpAgent.cache.get("email_batch_id");
  if (!_.isNil(batch_id)) {
    return {
      status: 200,
      data: {
        message: `Track Email Batch {${batch_id}} Already Initiated`
      }
    };
  }

  return syncAgent.eventsAgent
    .getCampaignsAndAutomationsToTrack()
    .then(async campaigns => {
      const operations = syncAgent.eventsAgent.getEmailActivitiesOps(campaigns);
      const res = await createBatch({ syncAgent, operations });
      if (res.status === 200 && res.data.id) {
        await mailchimpAgent.cache.set("email_batch_id", res.data.id, {
          ttl: 0
        });
      }
      return res;
    });
}

module.exports = createEmailBatch;
