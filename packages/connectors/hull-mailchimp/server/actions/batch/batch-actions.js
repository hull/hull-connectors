const _ = require("lodash");

const trackEvents = async ({ syncAgent, entities = [] }) => {
  const last_track_at = syncAgent.ship.private_settings.last_track_at;
  const campaigns = await syncAgent.eventsAgent.getCampaignsAndAutomationsToTrack();
  entities = syncAgent.eventsAgent.filterEvents(entities, last_track_at);

  entities = entities.map(emailActivity => {
    const campaign = _.find(campaigns, {
      id: emailActivity.campaign_id
    });
    emailActivity.title = _.get(campaign, "settings.title");
    return emailActivity;
  });

  syncAgent.metric.increment(
    "track.email_activities_for_campaign",
    entities.length
  );
  return syncAgent.eventsAgent.trackEvents(entities);
};

const importUsers = ({ syncAgent, entities = [] }) => {
  return entities.map(member => {
    return syncAgent.userMappingAgent.updateUser(member);
  });
};

module.exports = {
  trackEvents,
  importUsers
};
