/* @flow */
const moment = require("moment");
const _ = require("lodash");

const shipAppFactory = require("../lib/ship-app-factory");

/**
 * Track: check all "trackable" campaigns and automation emails,
 * then download events for them.
 */
function trackJob(ctx: any) {
  const { syncAgent, mailchimpAgent } = shipAppFactory(ctx);
  const last_track_at = _.get(ctx.connector, "private_settings.last_track_at");

  return syncAgent.eventsAgent
    .getCampaignsAndAutomationsToTrack()
    .then(campaigns => {
      const operations = syncAgent.eventsAgent.getEmailActivitiesOps(campaigns);
      ctx.metric.increment("track.operations", operations.length);
      return mailchimpAgent.batchAgent.create({
        operations,
        jobs: ["trackEmailActivities"],
        chunkSize: 200,
        extractField: "emails",
        additionalData: {
          last_track_at,
          campaigns
        },
        operationName: this.data.payload.operationName || null
      });
    })
    .then(() => {
      return ctx.helpers.settingsUpdate({
        last_track_at: moment.utc().format()
      });
    });
}

module.exports = trackJob;
