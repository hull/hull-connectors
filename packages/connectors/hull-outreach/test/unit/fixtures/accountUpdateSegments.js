module.exports = {
  configuration: {
    id: "5d51b4ebc07907e865025a7b",
    secret: "shhhhhh",
    organization: "organization.hullapp.io",
    hostname: "225ddbbc.connector.io",
    private_settings: {
      webhook_id: 123,
      user_claims: [
        {
          hull: "email",
          service: "emails"
        }
      ],
      refresh_token: "refresh_token",
      access_token: "access_token",
      outgoing_account_segments: "tags"
    }
  },
  route: "accountUpdate",
  input: {
    classType: {
      service_name: "HullOutgoingAccount",
      name: "Account"
    },
    context: {},
    data: [
      {
        account_segments: [
          {
            name: "Send Accounts To Intercom"
          }
        ],
        account: {
          "outreach/id": 1
        }
      },
      {
        account_segments: [
          {
            name: "Accounts With Email",
          },
          {
            name: "Send Accounts To Intercom"
          }
        ],
        account: {
          "outreach/id": 2
        }
      }
    ],
  },
  serviceRequests: [
    {
      localContext: expect.objectContaining({ accountId: 1 }),
      name: "outreach",
      op: "updateAccount",
      input: {
        data: {
          type: "account",
          id: 1,
          attributes: {
            tags: expect.arrayContaining(["Send Accounts To Intercom"])
          }
        }
      },
      result: {
        status: 200,
        text:
          '{"data":{"type":"account","id":1}}'
      }
    },
    {
      localContext: expect.objectContaining({ accountId: 2 }),
      name: "outreach",
      op: "updateAccount",
      input: {
        data: {
          type: "account",
          id: 2,
          attributes: {
            tags: expect.arrayContaining(["Accounts With Email", "Send Accounts To Intercom"])
          }
        }
      },
      result: {
        status: 200,
        text:
          '{"data":{"type":"account","id":2}}'
      }
    },
    {
      localContext: expect.anything(),
      name: "hull",
      op: "asAccount",
      input: {
        ident: {
          anonymous_id: "outreach:1",
        },
        attributes: {
          "outreach/id": {
            value: 1,
            operation: "set"
          }
        }
      },
      result: {}
    },
    {
      localContext: expect.anything(),
      name: "hull",
      op: "asAccount",
      input: {
        ident: {
          anonymous_id: "outreach:2",
        },
        attributes: {
          "outreach/id": {
            value: 2,
            operation: "set"
          }
        }
      },
      result: {}
    }
  ],
  result: expect.anything()
};
