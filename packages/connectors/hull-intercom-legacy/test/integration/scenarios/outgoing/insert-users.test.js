// @flow
import connectorConfig from "../../../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";
process.env.COMBINED = true;

describe("Send User Tests", () => {
  it("should insert a user", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        connector: {
          private_settings: {
            access_token: "intercomABC",
            synchronized_segments: ["s1"],
            sync_fields_to_intercom: [
              { hull: 'email', name: 'email' },
              { hull: 'traits_intercom/name', name: 'name' }
            ],
            sync_fields_to_hull: [
              { name: 'email', hull: 'traits_intercom/email' },
              { name: 'name', hull: 'traits_intercom/name' },
              { name: 'phone', hull: 'traits_intercom/phone' }
            ]
          }
        },
        usersSegments: [
          { id: "s2", name: "Segment 2" }
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
            .get("/tags")
            .reply(200, {
              "type": "tag.list",
              "tags": [
                {
                  "type": "tag",
                  "id": "3781751",
                  "name": "EmailMatches"
                }
              ]
            });

          scope
            .post("/tags", {
              "name": "Segment 2"
            }).reply(200, {
              "type": "tag",
              "id": "4339043",
              "name": "Segment 2"
            });

          scope
            .post("/tags", {
              "name": "Segment 2",
              "users": [
                {
                  "id": "5eff47fb8cf7dc62c216ea80",
                  "untag": true
                }
              ]
            }).reply(200, {
              "type": "tag",
              "id": "4339043",
              "name": "Segment 2"
            });

          scope
            .post("/users", {
              "email": "foo@bar.com",
              "name": "Bob Stein"
            }).reply(200, {
            "type": "user",
            "id": "5eff47fb8cf7dc62c216ea80",
            "user_id": null,
            "anonymous": false,
            "email": "foo@bar.com",
            "phone": null,
            "name": "Bob Stein",
            "pseudonym": null,
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
            "created_at": 1593788411,
            "remote_created_at": null,
            "signed_up_at": null,
            "updated_at": 1593788411,
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
            "custom_attributes": {},
            "referrer": null,
            "utm_campaign": null,
            "utm_content": null,
            "utm_medium": null,
            "utm_source": null,
            "utm_term": null,
            "do_not_track": null,
            "last_seen_ip": null,
            "user_agent_data": null
          });

          return scope;
        },
        messages: [
          {
            user: {
              id: "123",
              email: "foo@bar.com",
              "traits_intercom/tags": ["Segment 2"],
              "name": "Bob",
              "intercom/name": "Bob Stein"
            },
            segments: [{ id: "s1", name: "Segment 1" }],
            changes: {
              segments: {
                left: [{ id: "s2", name: "Segment 2" }]
              }
            },
            events: []
          }
        ],
        response: { "flow_control": { "type": "next" } },
        logs: [
          [
            "debug",
            "outgoing.user.start",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "123",
              "user_email": "foo@bar.com"
            },
            {
              "changes": {
                "segments": {
                  "left": [
                    {
                      "id": "s2",
                      "name": "Segment 2"
                    }
                  ]
                }
              },
              "events": [],
              "segments": [
                "Segment 1"
              ]
            }
          ],
          [
            "debug",
            "sendUsers.preFilter",
            {
              "request_id": expect.whatever()
            },
            1
          ],
          [
            "debug",
            "sendUsers.filtered",
            {
              "request_id": expect.whatever()
            },
            1
          ],
          [
            "debug",
            "connector.getWebhook",
            {
              "request_id": expect.whatever()
            },
            undefined
          ],
          [
            "debug",
            "connector.getWebhook.cachemiss",
            {
              "request_id": expect.whatever()
            },
            undefined
          ],
          [
            "debug",
            "connector.getExistingWebhooks",
            {
              "request_id": expect.whatever()
            },
            undefined
          ],
          [
            "debug",
            "connector.service_api.call",
            {
              "request_id": expect.whatever()
            },
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "https://api.intercom.io/subscriptions/",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {
              "request_id": expect.whatever()
            },
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
          [
            "debug",
            "connector.service_api.call",
            {
              "request_id": expect.whatever()
            },
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "https://api.intercom.io/tags",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {
              "request_id": expect.whatever()
            },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "https://api.intercom.io/tags",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "debug",
            "sendUsers",
            {
              "request_id": expect.whatever()
            },
            1
          ],
          [
            "debug",
            "outgoing.user.payload",
            {
              "request_id": expect.whatever()
            },
            {
              "email": "foo@bar.com",
              "name": "Bob Stein"
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {
              "request_id": expect.whatever()
            },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "https://api.intercom.io/users",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "info",
            "outgoing.user.success",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "123",
              "user_email": "foo@bar.com"
            },
            {
              "type": "user",
              "id": "5eff47fb8cf7dc62c216ea80",
              "user_id": null,
              "anonymous": false,
              "email": "foo@bar.com",
              "phone": null,
              "name": "Bob Stein",
              "pseudonym": null,
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
              "created_at": 1593788411,
              "remote_created_at": null,
              "signed_up_at": null,
              "updated_at": 1593788411,
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
              "custom_attributes": {},
              "referrer": null,
              "utm_campaign": null,
              "utm_content": null,
              "utm_medium": null,
              "utm_source": null,
              "utm_term": null,
              "do_not_track": null,
              "last_seen_ip": null,
              "user_agent_data": null
            }
          ],
          [
            "debug",
            "sendEvents.send_events_enabled",
            {
              "request_id": expect.whatever()
            },
            "No events specified."
          ],
          [
            "debug",
            "outgoing.user.add_segment_not_found",
            {
              "request_id": expect.whatever()
            },
            undefined
          ],
          [
          "debug",
            "intercomAgent.tagUsers",
            {
              "request_id": expect.whatever()
            },
            {
              "segmentName": "Segment 2",
              "usersCount": 1
            }
          ],
          [
          "debug",
            "connector.service_api.call",
            {
              "request_id": expect.whatever()
            },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "https://api.intercom.io/tags",
              "status": 200,
              "vars": {}
            }
          ]
        ],
        firehoseEvents: [],
        metrics: [
          ["increment","connector.request",1],
          ["increment","ship.outgoing.users",1],
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
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()]
        ],
        platformApiCalls: [
          [
            "GET",
            "/api/v1/app",
            {},
            {}
          ],
          [
            "PUT",
            "/api/v1/9993743b22d60dd829001999",
            {},
            {
              "private_settings": {
                "access_token": "intercomABC",
                "synchronized_segments": [
                  "s1"
                ],
                "sync_fields_to_intercom": [
                  {
                    "hull": "email",
                    "name": "email"
                  },
                  {
                    "hull": "traits_intercom/name",
                    "name": "name"
                  }
                ],
                "sync_fields_to_hull": [
                  {
                    "name": "email",
                    "hull": "traits_intercom/email"
                  },
                  {
                    "name": "name",
                    "hull": "traits_intercom/name"
                  },
                  {
                    "name": "phone",
                    "hull": "traits_intercom/phone"
                  }
                ],
                "webhook_id": "webhook-id-1"
              },
              "refresh_status": false
            }
          ],
          [
            "GET",
            "/api/v1/app",
            {},
            {}
          ],
          [
            "PUT",
            "/api/v1/9993743b22d60dd829001999",
            {},
            {
              "private_settings": {
                "access_token": "intercomABC",
                "synchronized_segments": [
                  "s1"
                ],
                "sync_fields_to_intercom": [
                  {
                    "hull": "email",
                    "name": "email"
                  },
                  {
                    "hull": "traits_intercom/name",
                    "name": "name"
                  }
                ],
                "sync_fields_to_hull": [
                  {
                    "name": "email",
                    "hull": "traits_intercom/email"
                  },
                  {
                    "name": "name",
                    "hull": "traits_intercom/name"
                  },
                  {
                    "name": "phone",
                    "hull": "traits_intercom/phone"
                  }
                ],
                "tag_mapping": {
                  "s2": "4339043"
                }
              },
              "refresh_status": false
            }
          ]
        ]
      };
    });
  });
});
