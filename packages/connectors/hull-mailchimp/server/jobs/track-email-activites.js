/* @flow */
const _ = require("lodash");
const { trackEvents } = require("../actions/batch/batch-actions");
const shipAppFactory = require("../lib/ship-app-factory");

function trackEmailActivities(ctx: any, payload: any) {
  const { syncAgent } = shipAppFactory(ctx);
  const emailActivities = _.get(payload, "response", []);
  return trackEvents({
    syncAgent,
    entities: emailActivities,
    additionalData: payload.additionalData
  });
}

module.exports = trackEmailActivities;
