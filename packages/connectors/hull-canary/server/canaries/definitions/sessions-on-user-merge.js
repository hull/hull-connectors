const { changedValueIsNew, startsWith, endsWith } = require("../conditionals");

let timestamp;

function firstUser(context) {
  const { client } = context;

  timestamp = Date.now();

  // first account only has external id
  const externalIdUser = { external_id: `${timestamp}ExternalId` };
  client.asUser(externalIdUser).track(
    "pageview",
    {
      url: "https://www.hull.io/contact"
    },
    {
      _sid: `sid1-${timestamp}`,
      _bid: `bid1-${timestamp}`
    }
  );
}

function secondUser(context) {
  const { client } = context;
  const emailUser = { email: `${timestamp}@somedomain.com` };
  client.asUser(emailUser).track(
    "pageview",
    {
      url: "https://www.hull.io/team"
    },
    {
      _sid: `sid2-${timestamp}`,
      _bid: `bid2-${timestamp}`
    }
  );
}

function mergeUsers(context) {
  const { client } = context;

  // then launch the call that will join the 2 accounts and verify in incoming requests after
  client
    .asUser({
      email: `${timestamp}@somedomain.com`,
      external_id: `${timestamp}ExternalId`
    })
    .traits({ note3: "from someCompany.com" });
}

module.exports = {
  name: "Test Merge Sessions on User Merge",
  timeToComplete: 600000,
  initialize: firstUser,
  stages: [
    {
      successCallback: secondUser,
      userEvents: 1,
      accountUpdates: 0,
      userAccountLinks: 0
    },
    {
      successCallback: mergeUsers,
      userEvents: 1,
      accountUpdates: 0,
      userAccountLinks: 0
    },
    {
      accountUpdates: 0,
      userAccountLinks: 0,
      userUpdateDefinitions: [
        {
          "user.email": endsWith("@somedomain.com"),
          "user.external_id": endsWith("ExternalId"),
          "user.first_session_id": startsWith("sid1"),
          "user.signup_session_id": startsWith("sid1"),
          "user.latest_session_id": startsWith("sid2"),
        }
      ]
    }
  ]
};
