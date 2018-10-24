const payloadAccounts = require("../../fixtures/api-responses/list-accounts.json");

module.exports = ctxMock => {
  const customFieldIdWithExternalId = "domain";
  const accountData = payloadAccounts.data[0];

  const expectedAccountIdent = {
    external_id: accountData.attributes[customFieldIdWithExternalId],
    domain: accountData.attributes.domain.replace("http://", ""),
    anonymous_id: `outreach:${accountData.id}`
  };

  const accountTraits = {
    name: {
      value: accountData.attributes.name,
      operation: "setIfNull"
    },
    "outreach/name": {
      value: accountData.attributes.name,
      operation: "set"
    },
    "outreach/custom_1": {
      value: accountData.attributes.custom1,
      operation: "set"
    },
    "outreach/custom_10": {
      value: accountData.attributes.custom10,
      operation: "set"
    },
    "outreach/domain": {
      value: accountData.attributes.domain,
      operation: "set"
    },
    "outreach/id": {
      value: accountData.id,
      operation: "set"
    },
    "outreach/created_at": {
      value: accountData.attributes.createdAt,
      operation: "setIfNull"
    },
    "outreach/updated_at": {
      value: accountData.attributes.updatedAt,
      operation: "set"
    }
  };

  // is this inserting domain and url automatically even if the customers didn't specify it?....
  // Causing domain to come in if it's specified as external id, might cause weird stuff to happen if we set the external id ever...
  // especially by accident if if got changed in hull and we resolved on something else..

  expect(ctxMock.client.asAccount.mock.calls[0]).toEqual([
    expectedAccountIdent
  ]);
  expect(ctxMock.client.traits.mock.calls[0]).toEqual([accountTraits]);

  /**
   * .account is called in cases where the account may have users inside of it or the other way around in order to set the account/user linkage...
   * ...I think....
   */
  // expect(ctxMock.client.account.mock.calls[0]).toEqual([expectedAccountIdent]);
  // expect(ctxMock.client.account.mock.calls[1]).toEqual([expectedAccountIdent]);
};
