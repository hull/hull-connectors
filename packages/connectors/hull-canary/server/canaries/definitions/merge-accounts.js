const { changedValueIsNew, endsWith, isNullOrUndefined } = require("../conditionals");
const { hullReservedCounter } = require("../reserved");

let timestamp;

function initializeMergeAccounts(context) {
  const { client } = context;

  timestamp = Date.now();

  // first account only has external id
  const externalIdAccount = { external_id: `${timestamp}ExternalId` };
  client
    .asAccount(externalIdAccount)
    .traits({ note1: "note1 from externalId" });

  // second account only has domain
  const domainAccount = { domain: `${timestamp}domain.com` };
  client.asAccount(domainAccount).traits({ note2: "note2 from domain" });

  // attaching users to the external id account
  for (let i = 0; i < 5; i += 1) {
    const asUser = client.asUser({ email: `externalIdUser${i}@hull.io` });
    asUser
      .traits(
        {
          testmergeaccountrun: timestamp
        },
        { source: "canary-merge-accounts" }
      )
      .then(() => {
        asUser.account(externalIdAccount).traits({});
      });
  }

  // attaching users to domain account
  for (let i = 0; i < 5; i += 1) {
    const asUser = client.asUser({ email: `domainUser${i}@hull.io` });
    asUser
      .traits(
        {
          testmergeaccountrun: timestamp
        },
        { source: "canary-merge-accounts" }
      )
      .then(() => {
        asUser.account(domainAccount).traits({});
      });
  }
}

function mergeAccounts(context) {
  const client = context.hull;

  // then launch the call that will join the 2 accounts and verify in incoming requests after
  client
    .asAccount({
      domain: `${timestamp}domain.com`,
      external_id: `${timestamp}ExternalId`
    })
    .traits({ note3: "from someCompany.com" });
}

module.exports = {
  name: "MergeAccounts",
  timeToComplete: 600000,
  initialize: initializeMergeAccounts,
  stages: [
    {
      userUpdates: 10,
      userAccountLinks: 10,
      accountsCreated: 2,
      successCallback: mergeAccounts,
      accountUpdateDefinitions: [
        {
          "changes.account.external_id": changedValueIsNew,
          "account.external_id": endsWith("ExternalId"),
          "changes.account.domain": isNullOrUndefined,
          "changes.account.note1": changedValueIsNew,
          "account.note1": "note1 from externalId"
        },
        {
          "changes.account.external_id": isNullOrUndefined,
          "changes.account.domain": changedValueIsNew,
          "account.domain": endsWith("domain.com"),
          "changes.account.note2": changedValueIsNew,
          "account.note2": "note2 from domain"
        }
      ]
    },
    // have not been getting any notifications about id changes on account when account merges
    // only get 5 notifications that the domain has been updated from null to something on the
    // users who were existing on the account that stayed on merge
    {
      userUpdates: 10,
      accountsMerged: 1,
      accountUpdateDefinitions: [
        {
          "changes.account.domain": changedValueIsNew,
          "changes.account.note3": changedValueIsNew
        }
      ],
      userUpdateDefinitions: [
        {
          [hullReservedCounter]: 5,
          "changes.account.domain": changedValueIsNew,
          "changes.account.note3": changedValueIsNew
        }
      ]
    }
  ]
};
