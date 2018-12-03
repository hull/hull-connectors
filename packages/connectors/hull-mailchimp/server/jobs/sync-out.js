/* @flow */
const Promise = require("bluebird");
const _ = require("lodash");

const shipAppFactory = require("../lib/ship-app-factory");

/**
 * Sync all operation handler. It drops all Mailchimp Segments aka Audiences
 * then creates them according to `segment_mapping` settings and triggers
 * sync for all users
 */
function syncOutJob(ctx: any, { recreate = true }: Object = {}) {
  const { syncAgent } = shipAppFactory(ctx);
  ctx.client.logger.info("outgoing.job.start", { recreate });

  return (() => {
    if (recreate) {
      // following two lines are effectively deleting static segments and custom interests
      // from mailchimp list
      return syncAgent.segmentsMappingAgent
        .syncSegments()
        .then(() => syncAgent.interestsMappingAgent.syncInterests());
    }
    return Promise.resolve();
  })()
    .then(() => {
      // creating static segments and interests again to match segments list from Hull
      return syncAgent.interestsMappingAgent
        .ensureCategory()
        .then(() => syncAgent.interestsMappingAgent.syncInterests(ctx.segments))
        .then(() => syncAgent.interestsMappingAgent.updateMapping())
        .then(() => syncAgent.segmentsMappingAgent.syncSegments(ctx.segments))
        .then(() => syncAgent.segmentsMappingAgent.updateMapping());
    })
    .then(() => {
      // request an extract for each segment from `synchronized_segments`
      const synchronizedSegments =
        ctx.connector.private_settings.synchronized_user_segments ||
        ctx.connector.private_settings.synchronized_segments ||
        [];
      const segments = _.intersectionBy(
        ctx.usersSegments,
        synchronizedSegments.map(sId => ({ id: sId })),
        "id"
      );
      const fields = syncAgent.userMappingAgent.getExtractFields();
      return Promise.map(segments, segment => {
        return ctx.helpers.extractRequest({
          segment,
          fields,
          format: "csv"
        });
      });
    });
}

module.exports = syncOutJob;
