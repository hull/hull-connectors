/* @flow */
const _ = require("lodash");
const shipAppFactory = require("../lib/ship-app-factory");

function trackUsers(ctx: any, payload: any) {
  const { syncAgent } = shipAppFactory(ctx);
  const users = _.get(payload, "users", []);
  const { last_track_at } = ctx.connector.private_settings;

  return syncAgent.eventsAgent
    .getMemberActivities(users)
    .then(emailActivites => {
      emailActivites = syncAgent.eventsAgent.filterEvents(
        emailActivites,
        last_track_at
      );
      ctx.metric.increment(
        "track.email_activites_for_user",
        emailActivites.length
      );
      return syncAgent.eventsAgent.trackEvents(emailActivites);
    });
}

module.exports = trackUsers;
