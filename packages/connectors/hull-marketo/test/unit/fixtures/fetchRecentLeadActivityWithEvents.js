module.exports = {
  configuration: {
    id: "5c092905c36af496c700012e",
    secret: "shhh",
    organization: "organization.hullapp.io",
    hostname: "connectortest.connectordomain.io",
    private_settings: {
      user_claims: [
        {
          hull: "email",
          service: "email"
        }
      ],
      fetch_all_attributes: true,
      synchronized_user_segments: [],
      flow_control_user_update_success_size: "100",
      marketo_client_id: "clientid",
      marketo_client_secret: "secret",
      marketo_authorized_user: "hullapi@hull.com",
      marketo_identity_url: "https://www.mktorest.com/identity",
      access_token: "access_token",
      expires_in: 3599,
      scope: "hull@hull.io",
      incoming_user_attributes: [
        {
          hull: "marketo/state",
          service: "state"
        }
      ],
      latestLeadSync: 1566915071252,
      fetch_events: true
    }
  },
  route: "fetchRecentLeadActivity",
  input: {},
  serviceRequests: [
    {
      localContext: expect.anything(),
      name: "marketo",
      op: "getLatestLeadActivityPagingToken",
      result: {
        status: 200,
        text:
          '{"requestId":"143d7#16cd36ffaa7","success":true,"nextPageToken":"4A27T3IS43BNATETNEWPYEYDBHUVYCRUNTSAXK6HBHZYH2N5YHK7LURSHID5L3VYBOQ6TZT5XUUPI==="}'
      }
    },
    {
      localContext: expect.anything(),
      name: "marketo",
      op: "getActivityTypeEnum",
      result: {
        status: 200,
        body: {
          requestId: "11248#16cd36ffd1c",
          result: [
            {
              id: 12,
              name: "New Lead",
              description: "New person/record is added to the lead database"
            },
            {
              id: 13,
              name: "Change Data Value",
              description: "Changed attribute value for a person/record"
            },
            {
              id: 14,
              name: "Send Email",
              description: "Sent someone an email"
            }
          ],
          success: true
        }
      }
    },
    {
      localContext: expect.anything(),
      name: "marketo",
      op: "getLatestLeadActivity",
      result: {
        status: 200,
        body: {
          requestId: "7b6b#16cd3700154",
          result: [
            {
              id: 11381935794,
              marketoGUID: "11381935794",
              leadId: 21749371,
              activityDate: "2019-08-27T14:11:59Z",
              activityTypeId: 12,
              fields: []
            },
            {
              id: 56789,
              marketoGUID: "56789",
              leadId: 234456,
              activityDate: "2019-08-27T14:11:59Z",
              activityTypeId: 14,
              fields: []
            },
            {
              id: 11381939114,
              marketoGUID: "11381939114",
              leadId: 21749371,
              activityDate: "2019-08-27T14:12:10Z",
              activityTypeId: 13,
              campaignId: 4828,
              fields: [
                {
                  id: 62,
                  name: "state",
                  newValue: "NC",
                  oldValue: null
                }
              ]
            },
            {
              id: 11381974430,
              marketoGUID: "11381974430",
              leadId: 21738032,
              activityDate: "2019-08-27T14:15:47Z",
              activityTypeId: 12,
              fields: []
            },
            {
              id: 11381975022,
              marketoGUID: "11381975022",
              leadId: 21738032,
              activityDate: "2019-08-27T14:16:08Z",
              activityTypeId: 13,
              campaignId: 4845,
              fields: [
                {
                  id: 62,
                  name: "state",
                  newValue: "TX",
                  oldValue: null
                }
              ]
            }
          ],
          success: true,
          nextPageToken:
            "4A27T3IS43BNATETNEWPYEYDBEUJANNG5XTL4MDYWMLDIJRLWHGWSCVZP76K6RSXYIHRI6BGMETWQ===",
          moreResult: false
        }
      }
    },
    {
      localContext: expect.objectContaining({
        leadActivity: expect.objectContaining({
          id: 11381939114,
          marketoGUID: "11381939114",
          leadId: 21749371,
          activityTypeId: 13,
          campaignId: 4828,
          fields: [
            {
              id: 62,
              name: "state",
              newValue: "NC",
              oldValue: null
            }
          ]
        })
      }),
      name: "hull",
      op: "asUser",
      input: {
        attributes: {
          "marketo/state": {
            value: "NC",
            operation: "set"
          },
          "marketo/id": {
            value: 21749371,
            operation: "set"
          }
        },
        ident: {
          anonymous_id: "marketo:21749371"
        }
      },
      result: {}
    },
    {
      localContext: expect.objectContaining({
        leadActivity: expect.objectContaining({
          id: 11381975022,
          marketoGUID: "11381975022",
          leadId: 21738032,
          activityTypeId: 13,
          campaignId: 4845,
          fields: [
            {
              id: 62,
              name: "state",
              newValue: "TX",
              oldValue: null
            }
          ]
        })
      }),
      name: "hull",
      op: "asUser",
      input: {
        attributes: {
          "marketo/state": {
            value: "TX",
            operation: "set"
          },
          "marketo/id": {
            value: 21738032,
            operation: "set"
          }
        },
        ident: {
          anonymous_id: "marketo:21738032"
        }
      },
      result: {}
    },
    {
      localContext: expect.anything(),
      name: "hull",
      op: "settingsUpdate",
      input: {
        latestLeadSync: expect.anything()
      }
    },
    {
      localContext: expect.objectContaining({
        leadActivity: expect.objectContaining({
          activityTypeId: 12,
          id: 11381935794,
          leadId: 21749371
        })
      }),
      op: "asUser",
      name: "hull",
      input: expect.anything(),
      result: {}
    },
    {
      localContext: expect.objectContaining({
        leadActivity: expect.objectContaining({
          activityTypeId: 12,
          id: 11381974430,
          leadId: 21738032
        })
      }),
      op: "asUser",
      name: "hull",
      input: expect.anything(),
      result: {}
    },
    {
      localContext: expect.objectContaining({
        leadActivity: expect.objectContaining({
          activityTypeId: 14,
          id: 56789,
          leadId: 234456
        })
      }),
      op: "asUser",
      name: "hull",
      input: {
        attributes: { "marketo/id": { operation: "set", value: 234456 } },
        events: [
          {
            context: { created_at: "2019-08-27T14:11:59Z", event_id: 56789 },
            eventName: "Email Sent"
          }
        ],
        ident: { anonymous_id: "marketo:234456" }
      },
      result: {}
    }
  ],
  result: expect.anything()
};
