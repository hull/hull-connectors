module.exports = {
  configuration: {
    private_settings: {
      access_token: "1234",
      events_to_fetch: [ "message_opened", "prospect_stage_changed" ],
      webhook_id: 134,
    }
  },
  route: "testCaching",
  input: {},
  serviceRequests: [
    {
      name: "outreach",
      op: "getUsersPaged",
      localContext: expect.anything(),
      result: {
        body: {
          data: [
            {
              id: 1,
              attributes: {
                email: "testingemail@hull.io"
              }
            }
          ]
        }
      }
    },
    {
      name: "outreach",
      op: "getSequencesPaged",
      localContext: expect.anything(),
      result: {
        body: {
          data: [
            {
              id: 42,
              attributes: {
                name: "Very interesting sequence name"
              }
            }
          ]
        }
      }
    }
  ],
  result: [
    {
      "1": "testingemail@hull.io"
    },
    {
      "42": "Very interesting sequence name"
    },
    {
      "1": "testingemail@hull.io"
    },
    {
      "42": "Very interesting sequence name"
    }
  ]
};
