module.exports = ctxMock => {
  const expectedUserIdent = [
    [{ email: "ceo@somehullcompany.com", anonymous_id: "outreach:1" }],
    [{ email: "noAccountProspect@noaccount.com", anonymous_id: "outreach:2" }]
  ];

  const userTraits = [
    [
      {
        "outreach/created_at": {
          operation: "set",
          value: "2018-09-20T18:33:53.000Z"
        },
        "outreach/custom_1": {
          operation: "set",
          value: "He's cool"
        },
        "outreach/first_name": {
          operation: "set",
          value: "MrCeo"
        },
        "outreach/last_name": {
          operation: "set",
          value: "Person"
        },
        "outreach/title": {
          operation: "set",
          value: "CEO"
        },
        "outreach/id": {
          operation: "set",
          value: 1
        }
      }
    ],
    [
      {
        "outreach/created_at": {
          operation: "set",
          value: "2018-09-20T18:35:02.000Z"
        },
        "outreach/first_name": {
          operation: "set",
          value: "NoAccountProspect"
        },
        "outreach/last_name": {
          operation: "set",
          value: "ProspectLast"
        },
        "outreach/title": {
          operation: "set",
          value: "CEO"
        },
        "outreach/id": {
          operation: "set",
          value: 2
        }
      }
    ],
    [{}],
    [{}]
  ];

  expect(ctxMock.client.asUser.mock.calls).toEqual(expectedUserIdent);
  expect(ctxMock.client.traits.mock.calls).toEqual(userTraits);

  /**
   * .account is called in cases where the account may have users inside of it or the other way around in order to set the account/user linkage...
   * ...I think....
   */
  const accountLinkageCalls = [
    [{ anonymous_id: "outreach:1" }],
    [{ anonymous_id: "outreach:3" }]
  ];

  expect(ctxMock.client.account.mock.calls).toEqual(accountLinkageCalls);
  // expect(ctxMock.client.account.mock.calls.length).toEqual(2);
};
