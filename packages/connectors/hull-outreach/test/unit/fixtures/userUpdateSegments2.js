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
      synchronized_user_segments: [],
      refresh_token: "refresh_token",
      access_token: "access_token",
      incoming_user_attributes: [
      ],
      outgoing_user_attributes: [
        {
          hull: "closeio/title",
          service: "title"
        }
      ],
      prospect_outgoing_user_segments: "custom1",
      prospect_outgoing_account_segments: "tags"
    }
  },
  route: "userUpdate",
  input: {
    classType: {
      service_name: "HullOutgoingUser",
      name: "User"
    },
    context: {},
    data: [
      {
        user: {
          id: "5d4933d23c51ff4f520754b3",
          created_at: "2019-08-06T08:01:22Z",
          email: "user2@chucksfarm.com",
          "closeio/title": "ceo",
          "outreach/id": 184849,
          indexed_at: "2019-08-07T21:25:39Z"
        },
        segments: [
          {
            id: "5c6b18761d7672a8f21a2f01",
            name: "Send Leads To Intercom",
            type: "users_segment",
            created_at: "2019-02-18T20:41:26Z",
            updated_at: "2019-02-18T20:41:26Z"
          }
        ],
        account_segments: [
          {
            name: "Send Accounts To Intercom"
          }
        ],
        account: {}
      },
      {
        user: {
          id: "5d4933d23c51ff4f520754b3",
          created_at: "2019-08-06T08:01:22Z",
          email: "user3@chucksfarm.com",
          "closeio/title": "cto",
          "outreach/id": 184850,
          indexed_at: "2019-08-07T21:25:39Z"
        },
        segments: [
          {
            id: "5d2692246bd734f4f10067dd",
            name: "Users with email",
            type: "users_segment",
            created_at: "2019-07-11T01:34:28Z",
            updated_at: "2019-07-11T01:34:28Z"
          },
          {
            id: "5c6b18761d7672a8f21a2f01",
            name: "Send Leads To Intercom",
            type: "users_segment",
            created_at: "2019-02-18T20:41:26Z",
            updated_at: "2019-02-18T20:41:26Z"
          }
        ],
        account_segments: [
          {
            name: "Accounts With Email"
          },
          {
            name: "Send Accounts To Intercom"
          }
        ],
        account: {}
      }
    ],
  },
  serviceRequests: [
    {
      localContext: expect.objectContaining({ userId: 184849 }),
      name: "outreach",
      op: "updateProspect",
      input: {
        data: {
          type: "prospect",
          id: 184849,
          attributes: {
            custom1: "[\"Send Leads To Intercom\"]",
            tags: expect.arrayContaining(["Send Accounts To Intercom"]),
            title: "ceo"
          }
        }
      },
      result: {
        status: 200,
        text:
          '{"data":{"type":"prospect","id":184849}}'
      }
    },
    {
      localContext: expect.objectContaining({ userId: 184850 }),
      name: "outreach",
      op: "updateProspect",
      input: {
        data: {
          type: "prospect",
          id: 184850,
          attributes: {
            custom1: "[\"Users with email\",\"Send Leads To Intercom\"]",
            tags: expect.arrayContaining(["Accounts With Email","Send Accounts To Intercom"]),
            title: "cto"
          }
        }
      },
      result: {
        status: 200,
        text:
          '{"data":{"type":"prospect","id":184850}}'
      }
    },
    {
      localContext: expect.anything(),
      name: "hull",
      op: "asUser",
      input: {
        ident: {
          anonymous_id: "outreach:184849",
        },
        attributes: {
          "outreach/id": {
            value: 184849,
            operation: "set"
          }
        }
      },
      result: {}
    },
    {
      localContext: expect.anything(),
      name: "hull",
      op: "asUser",
      input: {
        ident: {
          anonymous_id: "outreach:184850",
        },
        attributes: {
          "outreach/id": {
            value: 184850,
            operation: "set"
          }
        }
      },
      result: {}
    }
  ],
  result: expect.anything()
};
