// @flow
import connectorConfig from "../../../../server/config";
const webhookHandler = require("hull-connector-framework/src/purplefusion/webhooks/webhook-handler");
const intercomWebhookHandler = require("../../../../server/incoming-webhook")

const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";
process.env.COMBINED = true;

describe("User Webhooks Tests", () => {

  it("should receive a user.created webhook", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.incomingRequestHandler,
        rawCustomRoutes: [
          {
            url: "/webhooks",
            handler: webhookHandler,
            method: "post"
          }
        ],
        clientConfig: {
          cachedCredentials: {
            cacheCredentials: true,
            appendCredentials: false,
            credentialsKeyPath: "profile._json.app.id_code",
            serviceKey: "app_id",
            handler: intercomWebhookHandler
          }
        },
        connector: {
          private_settings: {
            access_token: "12345",
            fetch_users: true,
            user_claims: [
              { hull: 'email', service: 'email' },
              { hull: 'external_id', service: 'external_id' }
            ],
            users_last_fetch_timestamp: 1593169500,
            incoming_user_attributes: [
              { "service": "external_id", "hull": "intercom_user/user_id", "readOnly": true, "overwrite": true },
              { "service": "id", "hull": "intercom_user/id", "readOnly": true, "overwrite": true },
              { "service": "email", "hull": "intercom_user/email", "readOnly": true, "overwrite": true },
              { "service": "avatar", "hull": "intercom_user/avatar", "overwrite": true },
              { "service": "browser", "hull": "intercom_user/browser", "overwrite": true },
              { "service": "browser_language", "hull": "intercom_user/browser_language", "overwrite": true },
              { "service": "browser_version", "hull": "intercom_user/browser_version", "overwrite": true },
              { "service": "companies", "hull": "intercom_user/c_companies", "overwrite": true },
              { "service": "created_at", "hull": "intercom_user/created_at", "overwrite": true },
              { "service": "has_hard_bounced", "hull": "intercom_user/has_hard_bounced", "overwrite": true },
              { "service": "language_override", "hull": "intercom_user/language_override", "overwrite": true },
              { "service": "last_contacted_at", "hull": "intercom_user/last_contacted_at", "overwrite": true },
              { "service": "last_email_clicked_at", "hull": "intercom_user/last_email_clicked_at", "overwrite": true },
              { "service": "last_email_opened_at", "hull": "intercom_user/last_email_opened_at", "overwrite": true },
              { "service": "last_replied_at", "hull": "intercom_user/last_replied_at", "overwrite": true },
              { "service": "last_seen_at", "hull": "intercom_user/last_seen_at", "overwrite": true },
              { "service": "location.city", "hull": "intercom_user/location_city_name", "overwrite": true },
              { "service": "location.country", "hull": "intercom_user/location_country_name", "overwrite": true },
              { "service": "location.region", "hull": "intercom_user/location_region_name", "overwrite": true },
              { "service": "marked_email_as_spam", "hull": "intercom_user/marked_email_as_spam", "overwrite": true },
              { "service": "name", "hull": "intercom_user/name", "overwrite": true },
              { "service": "os", "hull": "intercom_user/os", "overwrite": true },
              { "service": "owner_id", "hull": "intercom_user/owner_id", "overwrite": true },
              { "service": "phone", "hull": "intercom_user/phone", "overwrite": true },
              { "service": "segments", "hull": "intercom_user/c_segments", "overwrite": true },
              { "service": "signed_up_at", "hull": "intercom_user/signed_up_at", "overwrite": true },
              { "service": "social_profiles", "hull": "intercom_user/c_social_profiles", "overwrite": true },
              { "service": "tags", "hull": "intercom_user/c_tags", "overwrite": true },
              { "service": "unsubscribed_from_emails", "hull": "intercom_user/unsubscribed_from_emails", "overwrite": true },
              { "service": "updated_at", "hull": "intercom_user/updated_at", "overwrite": true },
              { "service": 'custom_attributes.job_title', "hull": 'traits_intercom_user/job_title', "overwrite": true  },
              { "service": 'custom_attributes.c_domain', "hull": 'traits_intercom_user/duplicate_domain', "overwrite": true }
            ]
          }
        },
        usersSegments: [],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://api.intercom.io");

          scope
            .get("/contacts/5f297f71bce3e055f3afdf6e/segments")
            .reply(200, {
              "type": "list",
              "data": [
                {
                  "type": "segment",
                  "id": "5d2640faa76403cb13d73c2f",
                  "name": "Segment1",
                  "created_at": 1562788090,
                  "updated_at": 1595788749,
                  "person_type": "user"
                },
                {
                  "type": "segment",
                  "id": "5dd30458939b587add11f1aa",
                  "name": "Segment2",
                  "created_at": 1574110296,
                  "updated_at": 1595795580,
                  "person_type": "user"
                }
              ]
            });

          scope
            .get("/contacts/5f297f71bce3e055f3afdf6e/tags")
            .reply(200, {
              "type": "list",
              "data": [
                { "type": "tag", "id": "4406234", "name": "Tag1" },
                { "type": "tag", "id": "4406229", "name": "Tag2" }
              ]
            });

          return scope;
        },
        externalIncomingRequest: ({ superagent, connectorUrl, plainCredentials }) => {
          return superagent
            .post(`${connectorUrl}/webhooks?ship=${plainCredentials.ship}&organization=${plainCredentials.organization}&secret=1234`)
            .send(
              {
                "type": "notification_event",
                "app_id": "lkqcyt9t",
                "data": {
                  "type": "notification_event_data",
                  "item": {
                    "type": "user",
                    "id": "5f297f71bce3e055f3afdf6e",
                    "user_id": "2345234523452345",
                    "anonymous": false,
                    "email": "johnnybravo@rei.com",
                    "phone": null,
                    "name": "Johnny Bravo",
                    "pseudonym": null,
                    "avatar": {
                      "type": "avatar",
                      "image_url": null
                    },
                    "app_id": "lkqcyt9t",
                    "location_data": {
                      "type": "location_data",
                      "city_name": "Dublin",
                      "continent_code": "EU",
                      "country_code": "IRL",
                      "country_name": "Ireland",
                      "latitude": 53.159233,
                      "longitude": -6.723,
                      "postal_code": null,
                      "region_name": "Dublin",
                      "timezone": "Europe/Dublin"
                    },
                    "social_profiles": {
                      "type": "social_profile.list",
                      "social_profiles": [
                        {
                          "name": "Twitter",
                          "id": "1235d3213",
                          "username": "th1sland",
                          "url": "http://twitter.com/th1sland"
                        },
                        {
                          "name": "Facebook",
                          "id": "1235d3213",
                          "username": "facebookusrname",
                          "url": "http://facebook.com/th1sland"
                        }
                      ]
                    },
                    "companies": {
                      "type": "company.list",
                      "companies": [
                        {
                          "type": "company",
                          "company_id": "5f161ef9ce73f3ea2605304f-qualification-company",
                          "id": "5f161ef9ce73f3ea2605304e",
                          "name": "REI"
                        },
                        {
                          "type": "company",
                          "company_id": "5f161ef9ce73f3ea2605304f-qualification-company",
                          "id": "4563456345634563456",
                          "name": "REI"
                        }
                      ]
                    },
                    "last_request_at": null,
                    "created_at": "2020-08-04T15:32:01.666+00:00",
                    "remote_created_at": null,
                    "signed_up_at": null,
                    "updated_at": "2020-08-04T15:32:01.664+00:00",
                    "session_count": 0,
                    "owner_id": null,
                    "unsubscribed_from_emails": false,
                    "marked_email_as_spam": false,
                    "has_hard_bounced": false,
                    "tags": {
                      "type": "tag.list",
                      "tags": [
                        {
                          "type": "tag",
                          "id": "4406230"
                        },
                        {
                          "type": "tag",
                          "id": "4406236"
                        }
                      ]
                    },
                    "segments": {
                      "type": "segment.list",
                      "segments": []
                    },
                    "custom_attributes": {
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
                  }
                },
                "links": {},
                "id": "notif_d67fe036-69ce-4202-99c7-0b99c9a5b098",
                "topic": "user.created",
                "delivery_status": "pending",
                "delivery_attempts": 1,
                "delivered_at": 0,
                "first_sent_at": 1596555121,
                "created_at": 1596555121,
                "self": null
              }
            );
        },
        response: {},
        logs: [
          ["info", "incoming.job.start", {}, { "jobName": "Incoming Data", "type": "webpayload" }],
          [
            "debug",
            "connector.service_api.call",
            {},
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "/contacts/5f297f71bce3e055f3afdf6e/segments",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {},
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "/contacts/5f297f71bce3e055f3afdf6e/tags",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "debug",
            "incoming.user.success",
            {
              "subject_type": "user",
              "user_email": "johnnybravo@rei.com",
              "user_external_id": "2345234523452345",
              "user_anonymous_id": "intercom-user:user-5f297f71bce3e055f3afdf6e"
            },
            {
              "data": {
                "external_id": "2345234523452345",
                "id": "5f297f71bce3e055f3afdf6e",
                "email": "johnnybravo@rei.com",
                "avatar": null,
                "phone": null,
                "last_request_at": null,
                "created_at": 1596555122,
                "signed_up_at": null,
                "updated_at": 1596555122,
                "owner_id": null,
                "has_hard_bounced": false,
                "custom_attributes": {
                  "job_title": "sales"
                },
                "location": {
                  "type": "location_data",
                  "country": "Ireland",
                  "region": "Dublin",
                  "city": "Dublin"
                },
                "social_profiles": {
                  "type": "social_profile.list",
                  "data": [
                    {
                      "name": "Twitter",
                      "id": "1235d3213",
                      "username": "th1sland",
                      "url": "http://twitter.com/th1sland"
                    },
                    {
                      "name": "Facebook",
                      "id": "1235d3213",
                      "username": "facebookusrname",
                      "url": "http://facebook.com/th1sland"
                    }
                  ]
                },
                "companies": {
                  "type": "company.list",
                  "data": [
                    {
                      "type": "company",
                      "company_id": "5f161ef9ce73f3ea2605304f-qualification-company",
                      "id": "5f161ef9ce73f3ea2605304e",
                      "name": "REI"
                    },
                    {
                      "type": "company",
                      "company_id": "5f161ef9ce73f3ea2605304f-qualification-company",
                      "id": "4563456345634563456",
                      "name": "REI"
                    }
                  ]
                },
                "tags": {
                  "type": "tag.list",
                  "data": [
                    {
                      "type": "tag",
                      "id": "4406230"
                    },
                    {
                      "type": "tag",
                      "id": "4406236"
                    }
                  ]
                }
              },
              "type": "User"
            }
          ],
          [
            "info",
            "incoming.job.success",
            {},
            {
              "jobName": "Incoming Data",
              "type": "webpayload"
            }
          ]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asUser": {
                "email": "johnnybravo@rei.com",
                "external_id": "2345234523452345",
                "anonymous_id": "intercom-user:user-5f297f71bce3e055f3afdf6e"
              },
              "subjectType": "user"
            },
            {
              "intercom_user/user_id": {
                "operation": "set",
                "value": "2345234523452345"
              },
              "intercom_user/id": {
                "value": "5f297f71bce3e055f3afdf6e",
                "operation": "set"
              },
              "intercom_user/email": {
                "operation": "set",
                "value": "johnnybravo@rei.com"
              },
              "intercom_user/avatar": {
                "operation": "set",
                "value": null
              },
              "intercom_user/created_at": {
                "operation": "set",
                "value": 1596555122
              },
              "intercom_user/has_hard_bounced": {
                "operation": "set",
                "value": false
              },
              "intercom_user/location_city_name": {
                "operation": "set",
                "value": "Dublin"
              },
              "intercom_user/location_country_name": {
                "operation": "set",
                "value": "Ireland"
              },
              "intercom_user/location_region_name": {
                "operation": "set",
                "value": "Dublin"
              },
              "intercom_user/owner_id": {
                "operation": "set",
                "value": null
              },
              "intercom_user/phone": {
                "operation": "set",
                "value": null
              },
              "intercom_user/signed_up_at": {
                "operation": "set",
                "value": null
              },
              "intercom_user/updated_at": {
                "operation": "set",
                "value": 1596555122
              },
              "intercom_user/job_title": {
                "operation": "set",
                "value": "sales"
              },
              "intercom_user/c_companies": {
                "value": [
                  "REI"
                ],
                "operation": "set"
              },
              "intercom_user/c_segments": {
                "value": [
                  "Segment1",
                  "Segment2"
                ],
                "operation": "set"
              },
              "intercom_user/c_social_profiles": {
                "value": [
                  "http://twitter.com/th1sland",
                  "http://facebook.com/th1sland"
                ],
                "operation": "set"
              },
              "intercom_user/twitter_url": {
                "operation": "set",
                "value": "http://twitter.com/th1sland"
              },
              "intercom_user/facebook_url": {
                "operation": "set",
                "value": "http://facebook.com/th1sland"
              },
              "intercom_user/c_tags": {
                "value": [
                  "Tag1",
                  "Tag2"
                ],
                "operation": "set"
              }
            }
          ]
        ],
        metrics: [
          ["increment", "connector.request", 1],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.whatever()],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.whatever()]
        ],
        platformApiCalls: [
          [
            "GET",
            "/api/v1/app",
            {},
            {}
          ],
          [
            "GET",
            "/api/v1/users_segments?shipId=9993743b22d60dd829001999",
            {
              "shipId": "9993743b22d60dd829001999"
            },
            {}
          ],
          [
            "GET",
            "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999",
            {
              "shipId": "9993743b22d60dd829001999"
            },
            {}
          ]
        ]
      };
    });
  });
});
