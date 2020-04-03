const { changedValueIsNew, startsWith, endsWith } = require("../conditionals");

let timestamp;

function twoUsers(context) {
  const { client } = context;

  timestamp = Date.now();

  // first account only has external id
  const ident = { anonymous_id: `bid1-${timestamp}` };
  client.asUser(ident).track(
    "pageview",
    {
      url: "https://www.hull.io/contact"
    },
    {
      _sid: `sid1-${timestamp}`,
      _bid: `bid1-${timestamp}`
    }
  );

  const emailUser = { email: `${timestamp}@somedomain.com` };
  client.asUser(emailUser).traits({ "someattribute": "some value" });
}

function mergeUsersAndTrack(context) {
  const client = context.hull;

  const emailUser = {
    email: `${timestamp}@somedomain.com`,
    anonymous_id: `bid1-${timestamp}`
  };
  client.asUser(emailUser).traits({ "someattribute": "some value" })
    .then(() => {
      const ident = { anonymous_id: `bid1-${timestamp}` };
      client.asUser(ident).track(
        "pageview",
        {
          url: "https://www.hull.io/team"
        },
        {
          _sid: `sid2-${timestamp}`,
          _bid: `bid2-${timestamp}`
        }
      );
    });
}


module.exports = {
  name: "Test Merge with a traits call, then immediately call track for potential loss",
  timeToComplete: 600000,
  initialize: twoUsers,
  stages: [
    {
      successCallback: mergeUsersAndTrack,
      userEvents: 1,
      accountUpdates: 0,
      userAccountLinks: 0
    },
    {
      userEvents: 1,
      accountUpdates: 0,
      userAccountLinks: 0
    }
  ]
};
