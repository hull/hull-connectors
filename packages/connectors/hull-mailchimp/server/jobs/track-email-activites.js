/* @flow */
const _ = require("lodash");
const { trackEvents } = require("../actions/batch/batch-actions");
const shipAppFactory = require("../lib/ship-app-factory");

function trackEmailActivities(ctx: any, payload: any) {
  const { syncAgent } = shipAppFactory(ctx);
  const emailActivities = _.get(payload, "response", []);
  const { last_track_at, campaigns } = _.get(payload, "additionalData", {});
  return trackEvents({
    syncAgent,
    campaigns,
    last_track_at,
    entities: emailActivities
  });
}

module.exports = trackEmailActivities;
