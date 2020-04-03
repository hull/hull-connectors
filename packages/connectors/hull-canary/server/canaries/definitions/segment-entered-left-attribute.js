const { changedValueIsNew, startsWith, endsWith } = require("../conditionals");

let timestamp;

function setAttributeToEnterSegment(context) {
  const { client } = context;

  timestamp = Date.now();

  // first account only has external id
  const externalIdUser = { external_id: `${timestamp}ExternalId` };
  client.asUser(externalIdUser).traits({ "canary/segment_attribute": "somesegmentattribute" });
}

function setAttributeToLeaveSegment(context) {
  const client = context.hull;
  const externalIdUser = { external_id: `${timestamp}ExternalId` };
  client.asUser(externalIdUser).traits({ "canary/segment_attribute": null });
}

module.exports = {
  name: "Test User entering and leaving segment based on attribute change",
  timeToComplete: 600000,
  initialize: setAttributeToEnterSegment,
  stages: [
    {
      successCallback: setAttributeToLeaveSegment,
      userUpdates: 1,
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
      userUpdates: 1,
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
