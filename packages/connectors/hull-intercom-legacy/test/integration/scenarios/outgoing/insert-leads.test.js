// @flow
import connectorConfig from "../../../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";
process.env.COMBINED = true;

describe("Insert Lead Tests", () => {

  it("should insert a lead, create tags, create data attribute", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        is_export: true,
        connector: {
          private_settings: {
            access_token: "intercomABC",
            send_events: ["Email Opened", "Email Sent"],
            synchronized_segments: ["lead_segment_1"],
            sync_fields_to_intercom: [
              { hull: 'intercom/name', name: 'name' },
              { hull: 'intercom/description', name: 'c_description' },
              { hull: 'intercom/job_title', name: 'job_title' },
              { hull: 'account.description', name: 'c_description' }
            ],
            sync_fields_to_hull: [
              { name: 'email', hull: 'traits_intercom_lead/email', overwrite: true },
              { name: 'name', hull: 'traits_intercom_lead/name', overwrite: true },
              { name: 'phone', hull: 'traits_intercom_lead/phone', overwrite: true },
              { name: 'location.city', hull: 'traits_intercom_lead/city',  overwrite: true }
            ]
          }
        },
        usersSegments: [
          { id: "lead_segment_1", name: "Lead Segment 1" },
          { id: "lead_segment_2", name: "Lead Segment 2" },
          { id: "lead_segment_3", name: "Lead Segment 3" }
        ],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://api.intercom.io");

          scope
            .get("/subscriptions/")
            .reply(200, {
              "type": "notification_subscription.list",
              "items": []
            });

          scope
            .post("/subscriptions/").reply(200, {
            id: "webhook-id-1"
          });

          scope
            .post("/contacts", {
              "name": "Bob",
              "custom_attributes": {
                "c_description": "a description",
                "job_title": "sales"
              },
              "email": "bob@rei.com"
            }).reply(200, {
            "type": "contact",
            "id": "5f3be65142713c1f20d3fcc2",
            "user_id": "28ed46c9-c255-4477-9fa4-eb7bf687f863",
            "anonymous": true,
            "email": "bob@rei.com",
            "phone": null,
            "name": "Bob",
            "pseudonym": "Lilac Sunshine",
            "avatar": {
              "type": "avatar",
              "image_url": null
            },
            "app_id": "lkqcyt9t",
            "companies": {
              "type": "company.list",
              "companies": []
            },
            "location_data": {},
            "last_request_at": null,
            "created_at": 1597761105,
            "remote_created_at": null,
            "signed_up_at": null,
            "updated_at": 1597761105,
            "session_count": 0,
            "social_profiles": {
              "type": "social_profile.list",
              "social_profiles": []
            },
            "owner_id": null,
            "unsubscribed_from_emails": false,
            "marked_email_as_spam": false,
            "has_hard_bounced": false,
            "tags": {
              "type": "tag.list",
              "tags": []
            },
            "segments": {
              "type": "segment.list",
              "segments": []
            },
            "custom_attributes": {
              "c_description": "a description",
              "job_title": "sales"
            },
            "referrer": null,
            "utm_campaign": null,
            "utm_content": null,
            "utm_medium": null,
            "utm_source": null,
            "utm_term": null,
            "do_not_track": null,
            "last_seen_ip": null,
            "user_agent_data": null
          })

          scope
            .get("/tags")
            .reply(200, {
              "type": "tag.list",
              "tags": [
                {
                  "type": "tag",
                  "id": "3781751",
                  "name": "EmailMatches"
                },
                {
                  "type": "tag",
                  "id": "3781752",
                  "name": "Lead Segment 3"
                }
              ]
            });

          scope
            .post("/tags", {
              "name": "Lead Segment 1"
            }).reply(200, {
            "type": "tag",
            "id": "4339043",
            "name": "Lead Segment 1"
          });

          scope
            .post("/tags", {
              "name": "Lead Segment 2"
            }).reply(200, {
            "type": "tag",
            "id": "4339043",
            "name": "Lead Segment 2"
          });

          scope
            .post("/tags", {
              "name": "Lead Segment 1",
              "users": [
                {
                  "id": "5f3be65142713c1f20d3fcc2"
                }
              ]
            }).reply(200, {
            "type": "tag",
            "id": "4339043",
            "name": "Lead Segment 1"
          });

          scope
            .post("/tags", {
              "name": "Lead Segment 2",
              "users": [
                {
                  "id": "5f3be65142713c1f20d3fcc2"
                }
              ]
            }).reply(200, {
            "type": "tag",
            "id": "4339043",
            "name": "Lead Segment 2"
          });

          scope
            .post("/tags", {
              "name": "Lead Segment 3",
              "users": [
                {
                  "id": "5f3be65142713c1f20d3fcc2"
                }
              ]
            }).reply(200, {
            "type": "tag",
            "id": "4339043",
            "name": "Lead Segment 3"
          });

          return scope;
        },
        messages: [
          {
            account: {
              id: "1"
            },
            user: {
              id: "123",
              email: "bob@rei.com",
              "intercom/is_lead": true,
              "traits_intercom_lead/tags": ["Lead Segment 2", "Intercom Tag 1", "Intercom Tag 2"],
              "name": "Bob",
              "intercom/name": "Bob",
              "intercom/description": "a description",
              "intercom/job_title": "sales"
            },
            segments: [
              { id: "lead_segment_1", name: "Lead Segment 1" },
              { id: "lead_segment_2", name: "Lead Segment 2" },
              { id: "lead_segment_3", name: "Lead Segment 3" }
            ],
            changes: {
              user: {
                "traits_intercom_lead/description": [
                  "something",
                  "a description"
                ]
              },
              segments: {
                entered: [
                  { id: "lead_segment_1", name: "Lead Segment 1" },
                  { id: "lead_segment_2", name: "Lead Segment 2" }
                ],
                left: [
                  { id: "lead_segment_4", name: "Lead Segment 4" },
                  { id: "lead_segment_5", name: "Lead Segment 5" }
                ]
              }
            },
            events: [
              {
                "event": "Email Opened",
                "event_id": "email_opened_1",
                "user_id": "123",
                "properties": {
                  "prop1": "Email Opened 1",
                  "prop2": "Email Opened 2",
                  "prop3": "Email Opened 3",
                  "prop4": ["an", "array", "of", "values"],
                  "prop5": {
                    "value": ["another", "array", "of", "values"],
                    "url": "google.com",
                  },
                  "created": "1596228034"
                },
                "event_source": "hubspot",
                "context": {}
              },
              {
                "event": "Email Sent",
                "event_id": "email_sent_1",
                "user_id": "123",
                "properties": {
                  "prop1": "Email Sent 1",
                  "prop2": "Email Sent 2",
                  "prop3": "Email Sent 3",
                  "created": "1596228035"
                },
                "event_source": "hubspot",
                "context": {}
              },
              {
                "event": "Email Dropped",
                "event_id": "email_dropped_1",
                "user_id": "123",
                "properties": {
                  "prop1": "Email Dropped 1",
                  "prop2": "Email Dropped 2",
                  "prop3": "Email Dropped 3",
                  "created": "1596228036"
                },
                "event_source": "hubspot",
                "context": {}
              },
              {
                "event": "Email Sent",
                "event_id": "email_sent_2",
                "user_id": "123",
                "properties": {
                  "prop1": "Email Sent - intercom 1",
                  "prop2": "Email Sent - intercom 2",
                  "prop3": "Email Sent - intercom 3",
                  "created": "1596228037"
                },
                "event_source": "intercom",
                "context": {}
              }
            ]
          }
        ],
        response: { "flow_control": { "in": 5, "in_time": 10, "size": 10, "type": "next", } },
        logs: [
          ["debug", "Got lock value for sendleads: undefined in 0.001s", { "request_id": expect.whatever() }, undefined],
          ["debug", expect.whatever(), { "request_id": expect.whatever() }, undefined],
          ["debug", "sendLeads.preFilter", { "request_id": expect.whatever() }, 1],
          ["debug", "outgoing.user.start",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "123",
              "user_email": "bob@rei.com"
            },
            undefined
          ],
          ["debug", "connector.getWebhook", { "request_id": expect.whatever() }, undefined],
          ["debug", "connector.getWebhook.cachemiss", { "request_id": expect.whatever() }, undefined],
          ["debug", "connector.getExistingWebhooks", { "request_id": expect.whatever() }, undefined],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "https://api.intercom.io/subscriptions/",
              "status": 200,
              "vars": {}
            }
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "https://api.intercom.io/subscriptions/{{webhookId}}",
              "status": 200,
              "vars": {
                "webhookId": ""
              }
            }
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "https://api.intercom.io/tags",
              "status": 200,
              "vars": {}
            }
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "https://api.intercom.io/tags",
              "status": 200,
              "vars": {}
            }
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "https://api.intercom.io/tags",
              "status": 200,
              "vars": {}
            }
          ],
          ["debug", "trying to get leadid: undefined", { "request_id": expect.whatever() }, undefined],
          ["debug", "No lead id in cache for user 123", { "request_id": expect.whatever() }, undefined],
          ["debug", "sendLeads.filtered", { "request_id": expect.whatever() }, 1],
          ["debug", "postLeads", { "request_id": expect.whatever() }, 1],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "https://api.intercom.io/contacts",
              "status": 200,
              "vars": {}
            }
          ],
          ["info", "outgoing.user.success",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "123",
              "user_email": "bob@rei.com"
            },
            undefined
          ],
          ["debug", "sendLeads.savedleads", { "request_id": expect.whatever() }, 1],
          [
            "debug",
            "incoming.user.success",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_email": "bob@rei.com",
              "user_anonymous_id": "intercom:28ed46c9-c255-4477-9fa4-eb7bf687f863"
            },
            {
              "traits": {
                "email": {
                  "operation": "setIfNull",
                  "value": "bob@rei.com"
                },
                "intercom/email": {
                  "operation": "setIfNull",
                  "value": "bob@rei.com"
                },
                "intercom/id": {
                  "operation": "setIfNull",
                  "value": "5f3be65142713c1f20d3fcc2"
                },
                "intercom/owner_id": {
                  "operation": "setIfNull",
                  "value": null
                },
                "intercom/name": {
                  "operation": "setIfNull",
                  "value": "Bob"
                },
                "intercom/updated_at": {
                  "operation": "setIfNull",
                  "value": 1597761105
                },
                "intercom/signed_up_at": {
                  "operation": "setIfNull",
                  "value": null
                },
                "intercom/created_at": {
                  "operation": "setIfNull",
                  "value": 1597761105
                },
                "intercom/last_request_at": {
                  "operation": "setIfNull",
                  "value": null
                },
                "intercom/last_seen_ip": {
                  "operation": "setIfNull",
                  "value": null
                },
                "intercom/unsubscribed_from_emails": {
                  "operation": "setIfNull",
                  "value": false
                },
                "intercom/session_count": {
                  "operation": "setIfNull",
                  "value": 0
                },
                "intercom/pseudonym": {
                  "operation": "setIfNull",
                  "value": "Lilac Sunshine"
                },
                "intercom/anonymous": {
                  "operation": "setIfNull",
                  "value": true
                },
                "intercom/avatar": {
                  "operation": "setIfNull",
                  "value": null
                },
                "intercom/utm_campaign": {
                  "operation": "setIfNull",
                  "value": null
                },
                "intercom/utm_content": {
                  "operation": "setIfNull",
                  "value": null
                },
                "intercom/utm_medium": {
                  "operation": "setIfNull",
                  "value": null
                },
                "intercom/utm_source": {
                  "operation": "setIfNull",
                  "value": null
                },
                "intercom/utm_term": {
                  "operation": "setIfNull",
                  "value": null
                },
                "intercom_lead/email": {
                  "operation": "setIfNull",
                  "value": "bob@rei.com"
                },
                "intercom_lead/name": {
                  "operation": "setIfNull",
                  "value": "Bob"
                },
                "intercom_lead/phone": {
                  "operation": "setIfNull",
                  "value": null
                },
                "intercom/companies": [],
                "intercom/tags": [],
                "intercom/segments": [],
                "name": {
                  "operation": "setIfNull",
                  "value": "Bob"
                },
                "intercom/is_lead": true,
                "intercom/lead_user_id": "28ed46c9-c255-4477-9fa4-eb7bf687f863"
              }
            }
          ],
          ["debug", "sendEvents.users", { "request_id": expect.whatever() }, 1],
          ["debug", "sendEvents.users.filtered", { "request_id": expect.whatever() }, 1],
          ["debug", "sendEvents.events", { "request_id": expect.whatever() }, 0],
          ["debug", "sendEvents.events.filtered", { "request_id": expect.whatever() }, 0],
          ["debug", "intercomAgent.tagUsers", { "request_id": expect.whatever() },  {
              "segmentName": "Lead Segment 1",
              "usersCount": 1,
            }
          ],
          ["debug", "intercomAgent.tagUsers", { "request_id": expect.whatever() },  {
            "segmentName": "Lead Segment 2",
            "usersCount": 1,
          }],
          ["debug", "intercomAgent.tagUsers", { "request_id": expect.whatever() },  {
            "segmentName": "Lead Segment 3",
            "usersCount": 1,
          }],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "https://api.intercom.io/tags",
              "status": 200,
              "vars": {}
            }
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "https://api.intercom.io/tags",
              "status": 200,
              "vars": {}
            }
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "https://api.intercom.io/tags",
              "status": 200,
              "vars": {}
            }
          ],
          ["debug", "Releasing lock to sendleads", { "request_id": expect.whatever() }, undefined],
          ["debug", expect.whatever(), { "request_id": expect.whatever() }, undefined]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asUser": {
                "email": "bob@rei.com",
                "anonymous_id": "intercom:28ed46c9-c255-4477-9fa4-eb7bf687f863"
              },
              "subjectType": "user"
            },
            {
              "email": {
                "operation": "setIfNull",
                "value": "bob@rei.com"
              },
              "intercom/email": {
                "operation": "setIfNull",
                "value": "bob@rei.com"
              },
              "intercom/id": {
                "operation": "setIfNull",
                "value": "5f3be65142713c1f20d3fcc2"
              },
              "intercom/owner_id": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/name": {
                "operation": "setIfNull",
                "value": "Bob"
              },
              "intercom/updated_at": {
                "operation": "setIfNull",
                "value": 1597761105
              },
              "intercom/signed_up_at": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/created_at": {
                "operation": "setIfNull",
                "value": 1597761105
              },
              "intercom/last_request_at": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/last_seen_ip": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/unsubscribed_from_emails": {
                "operation": "setIfNull",
                "value": false
              },
              "intercom/session_count": {
                "operation": "setIfNull",
                "value": 0
              },
              "intercom/pseudonym": {
                "operation": "setIfNull",
                "value": "Lilac Sunshine"
              },
              "intercom/anonymous": {
                "operation": "setIfNull",
                "value": true
              },
              "intercom/avatar": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/utm_campaign": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/utm_content": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/utm_medium": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/utm_source": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/utm_term": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom_lead/email": {
                "operation": "setIfNull",
                "value": "bob@rei.com"
              },
              "intercom_lead/name": {
                "operation": "setIfNull",
                "value": "Bob"
              },
              "intercom_lead/phone": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/companies": [],
              "intercom/tags": [],
              "intercom/segments": [],
              "name": {
                "operation": "setIfNull",
                "value": "Bob"
              },
              "intercom/is_lead": true,
              "intercom/lead_user_id": "28ed46c9-c255-4477-9fa4-eb7bf687f863"
            }
          ]
        ],
        metrics: [
          ["increment","connector.request",1],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","ship.outgoing.leads",1],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","ship.outgoing.events",0],
          ["value","ship.outgoing.leadlatency",expect.whatever()]
        ],
        platformApiCalls: [
          ["GET", "/api/v1/app", {}, {}],
          ["PUT", "/api/v1/9993743b22d60dd829001999", {}, expect.objectContaining({"private_settings": expect.whatever()})],
          ["GET", "/api/v1/app", {}, {}],
          ["PUT", "/api/v1/9993743b22d60dd829001999", {}, expect.objectContaining({"private_settings": expect.whatever()})]
        ]
      };
    });
  });
});
