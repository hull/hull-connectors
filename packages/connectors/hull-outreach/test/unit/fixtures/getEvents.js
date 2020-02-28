module.exports = {
  configuration: {
    private_settings: {
      access_token: "1234",
      events_to_fetch: [ "message_opened", "prospect_stage_changed" ],
      webhook_id: 134,
    }
  },
  route: "eventsFetchAll",
  input: {},
  serviceRequests: [
    {
      name: "outreach",
      op: "getEventsPaged",
      localContext: [
        {
          "eventsToFetch": [
            "message_opened"
          ],
          "id_offset": 0,
          "page_limit": 1000,
          "service_name": "outreach"
        }
      ],
      result: {
        status: 200,
        body: {
          "data": [
            {
              "type": "event",
              "id": 186229,
              "attributes": {
                "body": null,
                "createdAt": "2019-12-04T13:58:13.000Z",
                "eventAt": "2019-12-04T13:58:13.000Z",
                "externalUrl": null,
                "mailingId": 1,
                "name": "message_opened",
                "payload": null,
                "requestCity": null,
                "requestDevice": null,
                "requestHost": null,
                "requestProxied": false,
                "requestRegion": null
              },
              "relationships": {
                "mailing": {
                  "data": null
                },
                "prospect": {
                  "data": {
                    "type": "prospect",
                    "id": 3
                  }
                },
                "user": {
                  "data": {
                    "type": "user",
                    "id": 1
                  }
                }
              },
              "links": {
                "self": "https://api.outreach.io/api/v2/events/186229"
              }
            },
            {
              "type": "event",
              "id": 186229,
              "attributes": {
                "body": null,
                "createdAt": "2019-12-04T13:58:13.000Z",
                "eventAt": "2019-12-04T13:58:13.000Z",
                "externalUrl": null,
                "mailingId": null,
                "name": "prospect_stage_changed",
                "payload": null,
                "requestCity": null,
                "requestDevice": null,
                "requestHost": null,
                "requestProxied": false,
                "requestRegion": null
              },
              "relationships": {
                "mailing": {
                  "data": null
                },
                "prospect": {
                  "data": {
                    "type": "prospect",
                    "id": 3
                  }
                },
                "user": {
                  "data": {
                    "type": "user",
                    "id": 1
                  }
                }
              },
              "links": {
                "self": "https://api.outreach.io/api/v2/events/186229"
              }
            }
          ],
          "meta": {
            "count": 1
          }
        }
      }
    },
    {
      name: "outreach",
      op: "getMailingDetails",
      localContext: expect.objectContaining({mailingId: 1}),
      result: {
        status: 200,
        body: {
          data: {
            attributes: {
              subject: "Very interesting subject"
            },
            relationships: {
              sequence: {
                data: {
                  id: 42
                }
              }
            }
          }
        }
      }
    },
    {
      name: "outreach",
      op: "getSequencesPaged",
      localContext: expect.objectContaining({enrichedEmail: {sequence_id: 42, email_subject: "Very interesting subject"}}),
      result: {
        body: {
          data: [
            {
              id: 42,
              attributes: {
                name: "Another one"
              }
            },
            {
              id: 84,
              attributes: {
                name: "Bites the dust"
              }
            }
          ]
        }
      }
    },
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
      name: "hull",
      op: "asUser",
      localContext: expect.anything(),
      input: {
        attributes: {
          "outreach/id": {
            operation: "set",
            value: 3
          }
        },
        events: [
          {
            context: {
              created_at: "2019-12-04T13:58:13.000Z",
              event_id: 186229,
              source: "Outreach"
            },
            eventName: "Message Opened",
            properties: {
              body: null,
              event_at: "2019-12-04T13:58:13.000Z",
              email_id: 1,
              email_subject: "Very interesting subject",
              sequence_id: 42,
              external_url: null,
              ip: null,
              payload: null,
              request_city: null,
              request_proxied: false,
              request_region: null,
              user_agent: null,
              sequence_name: "Another one",
              user_id: 1,
              user_email: "testingemail@hull.io"
            }
          }
        ],
        ident: {
          anonymous_id: "outreach:3"
        }
      }
    }
  ],
  result: [
    0,
    1000,
    "outreach",
    undefined
  ]
};
