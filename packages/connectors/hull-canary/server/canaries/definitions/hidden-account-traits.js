const {
  not,
  changedValueIsNew,
  endsWith,
  isNullOrUndefined
} = require("../conditionals");

let timestamp;

function initializeHiddenAccountTraits(context) {
  const { client } = context;

  timestamp = new Date().toISOString();
  console.log(`Now is ${timestamp}`);

  return Promise.all([
    client.put("settings/account_traits/invisibletrait", { visible: false }),
    client.put("settings/account_traits/visibletrait", { visible: true })
  ]).then(() => {
    console.log("Finished putting traits, putting emails now");
    return client
      .asUser({ email: `hiddenAccountTraitsUser@hull.io` })
      .account({ external_id: `hiddenAccountTraitsId${timestamp}-ExternalId` })
      .traits({ invisibletrait: `${timestamp}`, visibletrait: `${timestamp}` });
  });
}

async function checkESForTrait(propertyName, context) {
  const client = context.client;

  const response = await client.api("/search/account_report", "post", {
    query: {
      bool: {
        filter: [
          {
            terms: {
              external_id: [`hiddenAccountTraitsId${timestamp}-ExternalId`]
            }
          }
        ]
      }
    },
    sort: { created_at: "asc" },
    raw: true,
    page: 1,
    per_page: 2
  });

  if (response) {
    return true;
  }
  return false;
}

module.exports = {
  name: "TestHiddenAccountTraits",
  timeToComplete: 600000,
  initialize: initializeHiddenAccountTraits,
  stages: [
    {
      userUpdates: 1,
      accountUpdates: 1,
      userAccountLinks: 1,
      accountUpdateDefinitions: [
        {
          "changes.account.external_id": changedValueIsNew,
          "account.external_id": endsWith("ExternalId"),
          "account.visibletrait": not(isNullOrUndefined),
          "changes.account.domain": isNullOrUndefined,
          "changes.account.invisibletrait": isNullOrUndefined,
          "changes.account.visibletrait": changedValueIsNew,
          visibleTraitInEs: checkESForTrait
        }
      ],
      userUpdateDefinitions: [
        {
          "changes.account.external_id": not(isNullOrUndefined),
          "account.external_id": endsWith("ExternalId"),
          "account.visibletrait": not(isNullOrUndefined),
          "account.invisibletrait": isNullOrUndefined,
          "changes.account.domain": isNullOrUndefined,
          "changes.account.invisibletrait": isNullOrUndefined,
          "changes.account.visibletrait": not(isNullOrUndefined)
        }
      ]
    }
  ]
};
