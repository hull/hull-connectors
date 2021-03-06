// @flow
import connectorConfig from "../../../../server/config";
import manifest from "../../../../manifest.json";

const webhookHandler = require("hull-connector-framework/src/purplefusion/webhooks/webhook-handler");
const intercomWebhookHandler = require("../../../../server/incoming-webhook")

const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";

describe("Lead Webhooks Tests", () => {

  it("should receive a contact.created webhook", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.incomingRequestHandler,
        /*rawCustomRoutes: [
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
        },*/
        connector: {
          private_settings: {
            webhook_id: "1",
            access_token: "12345",
            fetch_users: true,
            lead_claims: [
              { hull: 'email', service: 'email' }
            ],
            users_last_fetch_timestamp: 1593169500,
            incoming_lead_attributes: [
              { "service": "external_id", "hull": "intercom_lead/user_id", "readOnly": true, "overwrite": true },
              { "service": "id", "hull": "intercom_lead/id", "readOnly": true, "overwrite": true },
              { "service": "email", "hull": "intercom_lead/email", "readOnly": true, "overwrite": true },
              { "service": "avatar", "hull": "intercom_lead/avatar", "overwrite": true },
              { "service": "browser", "hull": "intercom_lead/browser", "overwrite": true },
              { "service": "browser_language", "hull": "intercom_lead/browser_language", "overwrite": true },
              { "service": "browser_version", "hull": "intercom_lead/browser_version", "overwrite": true },
              { "service": "companies", "hull": "intercom_lead/c_companies", "overwrite": true },
              { "service": "created_at", "hull": "intercom_lead/created_at", "overwrite": true },
              { "service": "has_hard_bounced", "hull": "intercom_lead/has_hard_bounced", "overwrite": true },
              { "service": "language_override", "hull": "intercom_lead/language_override", "overwrite": true },
              { "service": "last_contacted_at", "hull": "intercom_lead/last_contacted_at", "overwrite": true },
              { "service": "last_email_clicked_at", "hull": "intercom_lead/last_email_clicked_at", "overwrite": true },
              { "service": "last_email_opened_at", "hull": "intercom_lead/last_email_opened_at", "overwrite": true },
              { "service": "last_replied_at", "hull": "intercom_lead/last_replied_at", "overwrite": true },
              { "service": "last_seen_at", "hull": "intercom_lead/last_seen_at", "overwrite": true },
              { "service": "location.city", "hull": "intercom_lead/location_city_name", "overwrite": true },
              { "service": "location.country", "hull": "intercom_lead/location_country_name", "overwrite": true },
              { "service": "location.region", "hull": "intercom_lead/location_region_name", "overwrite": true },
              { "service": "marked_email_as_spam", "hull": "intercom_lead/marked_email_as_spam", "overwrite": true },
              { "service": "name", "hull": "intercom_lead/name", "overwrite": true },
              { "service": "os", "hull": "intercom_lead/os", "overwrite": true },
              { "service": "owner_id", "hull": "intercom_lead/owner_id", "overwrite": true },
              { "service": "phone", "hull": "intercom_lead/phone", "overwrite": true },
              { "service": "segments", "hull": "intercom_lead/c_segments", "overwrite": true },
              { "service": "signed_up_at", "hull": "intercom_lead/signed_up_at", "overwrite": true },
              { "service": "social_profiles", "hull": "intercom_lead/c_social_profiles", "overwrite": true },
              { "service": "tags", "hull": "intercom_lead/c_tags", "overwrite": true },
              { "service": "unsubscribed_from_emails", "hull": "intercom_lead/unsubscribed_from_emails", "overwrite": true },
              { "service": "updated_at", "hull": "intercom_lead/updated_at", "overwrite": true },
              { "service": 'custom_attributes.job_title', "hull": 'traits_intercom_lead/job_title', "overwrite": true  },
              { "service": 'custom_attributes.c_domain', "hull": 'traits_intercom_lead/duplicate_domain', "overwrite": true }
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
                  "person_type": "lead"
                },
                {
                  "type": "segment",
                  "id": "5dd30458939b587add11f1aa",
                  "name": "Segment2",
                  "created_at": 1574110296,
                  "updated_at": 1595795580,
                  "person_type": "lead"
                }
              ]
            });

          scope
            .get("/tags")
            .reply(200, {
                "type": "list",
                "data": [
                  { "type": "tag", "id": "4406234", "name": "Tag1" },
                  { "type": "tag", "id": "4406229", "name": "Tag2" }
                ]
              }
            );

          return scope;
        },
        externalIncomingRequest: ({ superagent, connectorUrl, plainCredentials }) => {
          return superagent
            .post(`${connectorUrl}/webhooks?id=${plainCredentials.ship}&organization=${plainCredentials.organization}&secret=1234`)
            .send(
              {
                "type": "notification_event",
                "app_id": "lkqcyt9t",
                "data": {
                  "type": "notification_event_data",
                  "item": {
                    "type": "contact",
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
                          "id": "4406234"
                        },
                        {
                          "type": "tag",
                          "id": "4406229"
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
                "topic": "contact.created",
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
              "url": "/tags",
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
              "user_anonymous_id": "intercom-lead:lead-5f297f71bce3e055f3afdf6e"
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
                "name": "Johnny Bravo",
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
                      "id": "4406234"
                    },
                    {
                      "type": "tag",
                      "id": "4406229"
                    }
                  ]
                }
              },
              "type": "Lead"
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
                "anonymous_id": "intercom-lead:lead-5f297f71bce3e055f3afdf6e"
              },
              "subjectType": "user"
            },
            {
              "intercom_lead/user_id": {
                "operation": "set",
                "value": "2345234523452345"
              },
              "intercom_lead/id": {
                "value": "5f297f71bce3e055f3afdf6e",
                "operation": "set"
              },
              "intercom_lead/email": {
                "operation": "set",
                "value": "johnnybravo@rei.com"
              },
              "intercom_lead/avatar": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/created_at": {
                "operation": "set",
                "value": 1596555122
              },
              "intercom_lead/has_hard_bounced": {
                "operation": "set",
                "value": false
              },
              "intercom_lead/location_city_name": {
                "operation": "set",
                "value": "Dublin"
              },
              "intercom_lead/location_country_name": {
                "operation": "set",
                "value": "Ireland"
              },
              "intercom_lead/location_region_name": {
                "operation": "set",
                "value": "Dublin"
              },
              "intercom_lead/owner_id": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/phone": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/signed_up_at": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/updated_at": {
                "operation": "set",
                "value": 1596555122
              },
              "intercom_lead/job_title": {
                "operation": "set",
                "value": "sales"
              },
              "intercom_lead/c_companies": {
                "value": [
                  "REI"
                ],
                "operation": "set"
              },
              "intercom_lead/c_segments": {
                "value": [
                  "Segment1",
                  "Segment2"
                ],
                "operation": "set"
              },
              "intercom_lead/c_social_profiles": {
                "value": [
                  "http://twitter.com/th1sland",
                  "http://facebook.com/th1sland"
                ],
                "operation": "set"
              },
              "intercom_lead/twitter_url": {
                "operation": "set",
                "value": "http://twitter.com/th1sland"
              },
              "intercom_lead/facebook_url": {
                "operation": "set",
                "value": "http://facebook.com/th1sland"
              },
              "intercom_lead/name": {
                "operation": "set",
                "value": "Johnny Bravo"
              },
              "intercom_lead/c_tags": {
                "value": [
                  "Tag1",
                  "Tag2"
                ],
                "operation": "set"
              },
              "name": {
                "operation": "setIfNull",
                "value": "Johnny Bravo"
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
