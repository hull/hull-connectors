const { changedValueIsNew, startsWith, endsWith } = require("../conditionals");

let timestamp;

function trackToEnterSegment(context) {
  const { client } = context;

  timestamp = Date.now();

  // first account only has external id
  const externalIdUser = { external_id: `${timestamp}ExternalId` };
  client
    .asUser(externalIdUser)
    .track("Enter Canary Event", {
      "canary/event_property": "someeventproperty"
    });
}

function trackToLeaveSegment(context) {
  console.log("tracking left segment");
  const { client } = context;
  const externalIdUser = { external_id: `${timestamp}ExternalId` };
  client.asUser(externalIdUser).track("Leave Canary Event", { "canary/event_property": "someeventproperty" });
}

module.exports = {
  name: "Test User entering and leaving segment based on an event",
  timeToComplete: 600000,
  initialize: trackToEnterSegment,
  stages: [
    {
      successCallback: trackToLeaveSegment,
      userEvents: 2,
      accountUpdates: 0,
      userAccountLinks: 0,
      userUpdateDefinitions: [
        {
          "user.external_id": endsWith("ExternalId"),
          "changes.segments.entered[0].name": "Canary Event Based Segment"
        }
      ]
    },
    {
      userEvents: 2,
      accountUpdates: 0,
      userAccountLinks: 0,
      userUpdateDefinitions: [
        {
          "user.external_id": endsWith("ExternalId"),
          "changes.segments.left[0].name": "Canary Event Based Segment"
        }
      ]
    }
  ]
};
