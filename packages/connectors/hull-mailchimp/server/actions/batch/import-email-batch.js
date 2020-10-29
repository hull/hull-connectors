// @flow
import type { HullContext } from "hull";

const _ = require("lodash");
const moment = require("moment");
const shipAppFactory = require("../../lib/ship-app-factory");

export default async function importEmailBatch(ctx: HullContext) {
  const { mailchimpAgent } = shipAppFactory(ctx);
  const importType = "email";
  const jobName = "trackEmailActivities";

  const track_events = _.get(
    mailchimpAgent.ship.private_settings,
    "track_events",
    true
  );

  if (!track_events) {
    this.ctx.helpers.settingsUpdate({
      last_track_at: moment.utc().format()
    });
    await this.ctx.cache.del(`${importType}_batch_id`);
    await this.ctx.cache.del(`${importType}_batch_lock`);
    return {
      status: 200,
      data: {
        message: "Event Tracking Off"
      }
    };
  }

  const batchLockKey = `${importType}_batch_lock`;
  const batchLock = await ctx.cache.get(batchLockKey);

  if (!_.isNil(batchLock)) {
    ctx.client.logger.info("incoming.job.warning", {
      message: "Import already initiated",
      jobName: "mailchimp-batch-job",
      type: importType
    });
    return {
      status: 200,
      data: {
        message: "Import already initiated"
      }
    };
  }

  const batchId = await ctx.cache.get("email_batch_id");
  if (_.isNil(batchId)) {
    ctx.client.logger.info("incoming.job.success", {
      message: "No active batch to import",
      jobName: "mailchimp-batch-job",
      type: importType
    });
    return {
      status: 200,
      data: {
        message: "No active batch to import"
      }
    };
  }

  const importInitiated = moment().unix();
  await ctx.cache.set(
    batchLockKey,
    {
      connector: mailchimpAgent.ship.id,
      importType,
      importInitiated,
      batchId
    },
    { ttl: 43200 }
  );
  mailchimpAgent.batchAgent.handle({
    jobName,
    batchId,
    importType
  });

  return {
    status: 200,
    data: {
      status: "ok"
    }
  };
}
