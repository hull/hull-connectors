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

  // const closeIO = { domain: "close.io" }; //no attribute change
  // const bluth = { domain: "bluth.com" }; // yes attribute change
  // const externalIdAccount = { external_id: "Oct242018_338ExternalId" };
  // const wayne = { domain: "wayneenterprises.com" };
  //
  // client.asAccount(closeIO).traits({ "closeio/address_business_zipcode": "RI" });
  // client.asAccount(bluth).traits({ "closeio/address_business_state": "RI" });
  // client.asAccount(externalIdAccount).traits({ "outreach/custom_1": "different value"});
  // client.asAccount(wayne).traits({"closeio/description": "description of wayne enterprises from closeio"})

  // const bluth = { email: "bluth@close.io" }; //no attribute change
  // const darth = { email: "darth@darksideinc.com" }; // yes attribute change
  // const alberto = { email: "alberto@close.io" };
  //
  // client.asUser(bluth).traits({ "closeio/title": "Banana Stand Owner" });
  // client.asUser(darth).traits({ "testattributes/description": "Description of darth vader" });
  // client.asUser(alberto).traits({ "closeio/title": "Great Title"});
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
