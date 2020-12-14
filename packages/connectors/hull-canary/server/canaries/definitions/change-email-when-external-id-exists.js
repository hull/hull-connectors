const { endsWith } = require("../conditionals");

let timestamp;

function createUserWithExternalIdAndEmail(context) {
  const { client } = context;

  timestamp = Date.now();

  // first account only has external id
  const ident = {
    external_id: `${timestamp}ExternalId`,
    email: `${timestamp}@somelead.com`
  };
  client.asUser(ident).traits({ "canary/someattribute": "someattribute" });
}

// TODO by design this shouldn't work, if want to change email pass as trait
function changeEmail(context) {
  const { client } = context;
  const ident = {
    external_id: `${timestamp}ExternalId`
  };
  client.asUser(ident).traits({
    email: `${timestamp}@somealternatelead.com`,
    "canary/someattribute": "differentattributevalue"
  });
}

module.exports = {
  name: "Test changing an email with a traits call",
  timeToComplete: 600000,
  initialize: createUserWithExternalIdAndEmail,
  stages: [
    {
      successCallback: changeEmail,
      userUpdates: 1,
      accountUpdates: 0,
      userAccountLinks: 0,
      userUpdateDefinitions: [
        {
          "user.external_id": endsWith("ExternalId"),
          "user.email": endsWith("@somelead.com")
        }
      ]
    },
    {
      userUpdates: 1,
      accountUpdates: 0,
      userAccountLinks: 0,
      // TODO does not currently work right now....
      userUpdateDefinitions: [
        {
          "user.external_id": endsWith("ExternalId"),
          "user.email": endsWith("@somealternatelead.com"),
          "changes.user.email[0]": endsWith("@somelead.com"),
          "changes.user.email[1]": endsWith("@somealternatelead.com")
        }
      ]
    }
  ]
};
