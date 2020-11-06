// @flow
import type { HullContext, HullIncomingHandlerMessage } from "hull";

const _ = require("lodash");
const moment = require("moment");
const shipAppFactory = require("../../lib/ship-app-factory");

export default async function importBatch(
  ctx: HullContext,
  incomingMessage: HullIncomingHandlerMessage
) {
  const { mailchimpAgent, syncAgent } = shipAppFactory(ctx);
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

  const batchLockKey = `${import_type}_batch_lock`;
  const batchLock = await ctx.cache.get(batchLockKey);
  if (!_.isNil(batchLock)) {
    return {
      status: 200,
      data: {
        message: "Import already initiated"
      }
    };
  }

  const importInitiated = moment().unix();
  await ctx.cache.set(
    batchLockKey,
    {
      connector: mailchimpAgent.ship.id,
      importType: import_type,
      importInitiated,
      batchId: batch_id
    },
    { ttl: 43200 }
  );
  if (import_type === "email") {
    const campaigns = await syncAgent.eventsAgent.getCampaignsAndAutomationsToTrack();
    const last_track_at = syncAgent.ship.private_settings.last_track_at;
    return mailchimpAgent.batchAgent.handle({
      jobName: "trackEmailActivities",
      batchId: batch_id,
      importType: import_type,
      additionalData: { campaigns, last_track_at }
    });
  }

  if (import_type === "member") {
    return mailchimpAgent.batchAgent.handle({
      jobName: "importUsers",
      batchId: batch_id,
      importType: import_type
    });
  }

  return {};
}
