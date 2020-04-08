function initializeLinkUserToAccount(context) {
  const { client } = context;

  const timestamp = Date.now();

  const domainAccount = { domain: `${timestamp}domain.com` };

  const asUser = client.asUser({ email: `domainUser@hull.io` });
  asUser
    .traits(
      {
        testlinkaccountrun: timestamp
      },
      { source: "canary-link-accounts" }
    )
    .then(() => {
      client.asAccount(domainAccount).traits({ note1: "note1 from domain" });
    })
    .then(() => {
      asUser.account(domainAccount).traits({});
    });
}

module.exports = {
  name: "LinkUserToAccount",
  timeToComplete: 300000,
  initialize: initializeLinkUserToAccount,
  stages: [
    {
      userUpdates: 1,
      accountsCreated: 1,
      accountUpdates: 1,
      userAccountLinks: 1
    }
  ]
};
