const { changedValueIsNew, startsWith, endsWith } = require("../conditionals");

let timestamp;

function setAttributeToEnterSegment(context) {
  const { client } = context;

  timestamp = Date.now();

  // first account only has external id
  const externalIdUser = { external_id: `${timestamp}ExternalId` };
  client
    .asUser(externalIdUser)
    .traits({ "canary/segment_attribute2": "somesegmentattribute" })
  return context.helpers
    .settingsUpdate({
      events_to_send: ["ALL"]
    })
    .then(() => {
      console.log("sending traits: " + JSON.stringify(externalIdUser, null, 2));
      return client
        .asUser(externalIdUser)
        .traits({ "canary/segment_attribute": "somesegmentattribute" })
        .then(() => {
          console.log("sent");
        });
    });
}

function resetSettings(context) {
  return context.helpers.settingsUpdate({
    events_to_send: [
      "Segments changed",
      "pageview",
      "Enter Canary Event",
      "Leave Canary Event"
    ]
  });
}

function setAttributeToLeaveSegment(context) {
  const { client } = context;
  const externalIdUser = { external_id: `${timestamp}ExternalId` };
  client
    .asUser(externalIdUser)
    .traits({ "canary/segment_attribute": null });

  return resetSettings(context).then(() => {
    return client
      .asUser(externalIdUser)
      .traits({ "canary/segment_attribute": null });
  });
}

module.exports = {
  name: "Test User entering and leaving segment based on attribute change",
  timeToComplete: 600000,
  initialize: setAttributeToEnterSegment,
  stages: [
    {
      successCallback: setAttributeToLeaveSegment,
      failureCallback: resetSettings,
      userEvents: 0,
      accountUpdates: 0,
      userAccountLinks: 0,
      userUpdateDefinitions: [
        {
          "user.external_id": endsWith("ExternalId"),
          "changes.segments.entered[0].name": "Canary Attribute Based Segment"
        }
      ]
    },
    {
      userEvents: 1,
      accountUpdates: 0,
      userAccountLinks: 0,
      userUpdateDefinitions: [
        {
          "user.external_id": endsWith("ExternalId"),
          "changes.segments.left[0].name": "Canary Attribute Based Segment"
        }
      ]
    }
  ]
};
