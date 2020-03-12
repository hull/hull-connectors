module.exports = {
  configuration: {
    private_settings: {
      access_token: "1234",
      events_to_fetch: [ "message_opened", "prospect_stage_changed", "outbound_call_completed" ],
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
            "message_opened",
            "outbound_call_completed"
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
              "id": 186230,
              "attributes": {
                "body": null,
                "createdAt": "2019-12-05T13:58:13.000Z",
                "eventAt": "2019-12-05T13:58:13.000Z",
                "externalUrl": null,
                "mailingId": 2,
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
                    "id": 7
                  }
                },
                "user": {
                  "data": {
                    "type": "user",
                    "id": 2
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
            },
            {
              "type": "event",
              "id": 98765,
              "attributes": {
                "body": null,
                "createdAt": "2020-03-21T09:03:43.000Z",
                "eventAt": "2020-03-21T09:03:43.000Z",
                "externalUrl": null,
                "mailingId": null,
                "name": "outbound_call_completed",
                "payload": {
                  "from": "+15552345678",
                  "to": "+15559872345",
                  "recordingUrl": "https://api.voicerecorder.com/12345",
                  "callDispositionName": "Fun Call with Client"
                },
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
                    "id": 5678
                  }
                },
                "user": {
                  "data": {
                    "type": "user",
                    "id": 23
                  }
                }
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
      op: "getMailingDetailsBatch",
      localContext: expect.objectContaining({mailingIds: "1,2"}),
      result: {
        status: 200,
        body: {
          data: [
            {
              id: 1,
              attributes: {
                subject: "Very interesting subject"
              },
              relationships: {
                sequence: {
                  data: {
                    id: 42
                  }
                },
                sequenceStep: {
                  data: {
                    type: "sequenceStep",
                    id: 234
                  }
                }
              }
            },
            {
              id: 2,
              attributes: {
                subject: "A different subject"
              },
              relationships: {
                sequence: {
                  data: {
                    id: 84
                  }
                },
                sequenceStep: {
                  data: {
                    type: "sequenceStep",
                    id: 567
                  }
                }
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
      op: "getSequenceStepsPaged",
      localContext: expect.anything(),
      result: {
        body: {
          data: [
            {
              id: 234,
              attributes: {
                displayName: "Some sequence step"
              }
            },
            {
              id: 567,
              attributes: {
                displayName: "Another Sequence Step"
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
            },
            {
              id: 2,
              attributes: {
                email: "testingemail2@hull.io"
              }
            },
            {
              id: 23,
              attributes: {
                email: "salesmcsalesman@hull.io"
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
        "attributes": {
          "outreach/id": {
            "operation": "set",
            "value": 3
          }
        },
        "events": [
          {
            "context": {
              "created_at": "2019-12-04T13:58:13.000Z",
              "event_id": 186229,
              "source": "Outreach"
            },
            "eventName": "Message Opened",
            "properties": {
              "body": null,
              "email_id": 1,
              "email_subject": "Very interesting subject",
              "event_at": "2019-12-04T13:58:13.000Z",
              "external_url": null,
              "ip": null,
              "payload": null,
              "request_city": null,
              "request_proxied": false,
              "request_region": null,
              "sequence_id": 42,
              "sequence_name": "Another one",
              "user_agent": null,
              "user_email": "testingemail@hull.io",
              "user_id": 1,
              "sequence_step_id": 234,
              "sequence_step_name": "Some sequence step",
            }
          }
        ],
        "ident": {
          "anonymous_id": "outreach:3"
        }
      }
    },
    {
      name: "hull",
      op: "asUser",
      localContext: expect.anything(),
      input: {
        "attributes": {
          "outreach/id": {
            "operation": "set",
            "value": 5678
          }
        },
        "events": [
          {
            "context": {
              "created_at": "2020-03-21T09:03:43.000Z",
              "event_id": 98765,
              "source": "Outreach"
            },
            "eventName": "Outbound Call Completed",
            "properties": {
              "body": null,
              "email_id": null,
              "event_at": "2020-03-21T09:03:43.000Z",
              "external_url": null,
              "ip": null,
              "payload": {
                "callDispositionName": "Fun Call with Client",
                "from": "+15552345678",
                "recordingUrl": "https://api.voicerecorder.com/12345",
                "to": "+15559872345"
              },
              "request_city": null,
              "request_proxied": false,
              "request_region": null,
              "user_agent": null,
              "user_email": "salesmcsalesman@hull.io",
              "user_id": 23
            }
          }
        ],
        "ident": {
          "anonymous_id": "outreach:5678"
        }
      }
    },
    {
      name: "hull",
      op: "asUser",
      localContext: expect.anything(),
      input: {
        "attributes": {
          "outreach/id": {
            "operation": "set",
            "value": 7
          }
        },
        "events": [
          {
            "context": {
              "created_at": "2019-12-05T13:58:13.000Z",
              "event_id": 186230,
              "source": "Outreach"
            },
            "eventName": "Message Opened",
            "properties": {
              "body": null,
              "email_id": 2,
              "email_subject": "A different subject",
              "event_at": "2019-12-05T13:58:13.000Z",
              "external_url": null,
              "ip": null,
              "payload": null,
              "request_city": null,
              "request_proxied": false,
              "request_region": null,
              "sequence_id": 84,
              "sequence_name": "Bites the dust",
              "sequence_step_id": 567,
              "sequence_step_name": "Another Sequence Step",
              "user_agent": null,
              "user_email": "testingemail2@hull.io",
              "user_id": 2
            }
          }
        ],
        "ident": {
          "anonymous_id": "outreach:7"
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
