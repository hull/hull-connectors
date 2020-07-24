// @flow
import connectorConfig from "../../../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";
process.env.COMBINED = true;

describe("Fetch All Leads Tests", () => {

  it("should fetch all leads", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.jsonHandler,
        handlerUrl: "fetchAllLeads",
        connector: {
          private_settings: {
            access_token: "12345",
            fetch_leads: true,
            sync_fields_to_hull: [
              { name: 'job_title', hull: 'traits_intercom/job_title' },
              { name: 'c_domain', hull: 'traits_intercom/duplicate_domain' }
            ]
          }
        },
        usersSegments: [],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://api.intercom.io");

          scope
            .post("/contacts/search", {
              "query":  {
                "operator": "AND",
                "value": [
                  {
                    "field": "updated_at",
                    "operator": ">",
                    "value": 0
                  },
                  {
                    "field": "role",
                    "operator": "=",
                    "value": "lead"
                  }
                ]
              },
              "pagination": {
                "per_page": 150
              },
              "sort": {
                "field": "updated_at",
                "order": "descending"
              }
            })
            .reply(200, {
              "type": "list",
              "data": [
                {
                  "type": "contact",
                  "id": "5f161b7a332231fc10b44e5f",
                  "workspace_id": "lkqcyt9t",
                  "external_id": "34235",
                  "role": "lead",
                  "email": "lizalead@rei.com",
                  "phone": null,
                  "name": "Liza Lead",
                  "avatar": null,
                  "owner_id": null,
                  "social_profiles": {
                    "type": "list",
                    "data": []
                  },
                  "has_hard_bounced": false,
                  "marked_email_as_spam": false,
                  "unsubscribed_from_emails": false,
                  "created_at": 1593169501,
                  "updated_at": 1593169501,
                  "signed_up_at": null,
                  "last_seen_at": null,
                  "last_replied_at": null,
                  "last_contacted_at": null,
                  "last_email_opened_at": null,
                  "last_email_clicked_at": null,
                  "language_override": null,
                  "browser": null,
                  "browser_version": null,
                  "browser_language": null,
                  "os": null,
                  "location": {
                    "type": "location",
                    "country": null,
                    "region": null,
                    "city": null
                  },
                  "android_app_name": null,
                  "android_app_version": null,
                  "android_device": null,
                  "android_os_version": null,
                  "android_sdk_version": null,
                  "android_last_seen_at": null,
                  "ios_app_name": null,
                  "ios_app_version": null,
                  "ios_device": null,
                  "ios_os_version": null,
                  "ios_sdk_version": null,
                  "ios_last_seen_at": null,
                  "custom_attributes": {
                    "job_title": "engineer"
                  },
                  "tags": {
                    "type": "list",
                    "data": [
                      {
                        "id": "4406240",
                        "type": "tag",
                        "url": "/tags/4406240"
                      }
                    ],
                    "url": "/contacts/5f161b7a332231fc10b44e5f/tags",
                    "total_count": 12,
                    "has_more": true
                  },
                  "notes": {
                    "type": "list",
                    "data": [],
                    "url": "/contacts/5f161b7a332231fc10b44e5f/notes",
                    "total_count": 0,
                    "has_more": false
                  },
                  "companies": {
                    "type": "list",
                    "data": [
                      {
                        "id": "5f161ef9ce73f3ea2605304e",
                        "type": "company",
                        "url": "/companies/5f161ef9ce73f3ea2605304e"
                      }
                    ],
                    "url": "/contacts/5f161b7a332231fc10b44e5f/companies",
                    "total_count": 1,
                    "has_more": false
                  }
                }
              ],
              "total_count": 2,
              "pages": {
                "type": "pages",
                "next": {
                  "page": 2,
                  "starting_after": "Wy0xLCI1ZjE2MWI3YTMzMjIzMWZjMTBiNDRlNWYiLDJd"
                },
                "page": 1,
                "per_page": 1,
                "total_pages": 2
              }
            });

          scope
            .get("/contacts/5f161b7a332231fc10b44e5f/tags")
            .reply(200, {
              "type": "list",
              "data": [
                { "type": "tag", "id": "4406234", "name": "Tag1" },
                { "type": "tag", "id": "4406229", "name": "Tag2" },
                { "type": "tag", "id": "4406230", "name": "Tag3" },
                { "type": "tag", "id": "4406232", "name": "Tag4" },
                { "type": "tag", "id": "4406231", "name": "Tag5" },
                { "type": "tag", "id": "4406240", "name": "Tag6" },
                { "type": "tag", "id": "4406233", "name": "Tag7" },
                { "type": "tag", "id": "4406235", "name": "Tag8" },
                { "type": "tag", "id": "4406237", "name": "Tag9" },
                { "type": "tag", "id": "4406238", "name": "Tag10" },
                { "type": "tag", "id": "4406236", "name": "Tag11" },
                { "type": "tag", "id": "4406239", "name": "Tag12" },
              ]
            });

          scope
            .post("/contacts/search", {
              "query":  {
                "operator": "AND",
                "value": [
                  {
                    "field": "updated_at",
                    "operator": ">",
                    "value": 0
                  },
                  {
                    "field": "role",
                    "operator": "=",
                    "value": "lead"
                  }
                ]
              },
              "pagination": {
                "per_page": 150,
                "starting_after": "Wy0xLCI1ZjE2MWI3YTMzMjIzMWZjMTBiNDRlNWYiLDJd"
              },
              "sort": {
                "field": "updated_at",
                "order": "descending"
              }
            })
            .reply(200, {
              "type": "list",
              "data": [
                {
                  "type": "contact",
                  "id": "5f1afdc24c358c20a4545cdc",
                  "workspace_id": "lkqcyt9t",
                  "external_id": null,
                  "role": "lead",
                  "email": "roberto.hernandez@rei.com",
                  "phone": null,
                  "name": "Roberto Hernandez",
                  "avatar": null,
                  "owner_id": null,
                  "social_profiles": {
                    "type": "list",
                    "data": []
                  },
                  "has_hard_bounced": false,
                  "marked_email_as_spam": false,
                  "unsubscribed_from_emails": false,
                  "created_at": 1593169501,
                  "updated_at": 1593169501,
                  "signed_up_at": null,
                  "last_seen_at": null,
                  "last_replied_at": null,
                  "last_contacted_at": null,
                  "last_email_opened_at": null,
                  "last_email_clicked_at": null,
                  "language_override": null,
                  "browser": null,
                  "browser_version": null,
                  "browser_language": null,
                  "os": null,
                  "location": {
                    "type": "location",
                    "country": null,
                    "region": null,
                    "city": null
                  },
                  "android_app_name": null,
                  "android_app_version": null,
                  "android_device": null,
                  "android_os_version": null,
                  "android_sdk_version": null,
                  "android_last_seen_at": null,
                  "ios_app_name": null,
                  "ios_app_version": null,
                  "ios_device": null,
                  "ios_os_version": null,
                  "ios_sdk_version": null,
                  "ios_last_seen_at": null,
                  "custom_attributes": {
                    "c_domain": "rei.com"
                  },
                  "tags": {
                    "type": "list",
                    "data": [],
                    "url": "/contacts/5f1afdc24c358c20a4545cdc/tags",
                    "total_count": 0,
                    "has_more": false
                  },
                  "notes": {
                    "type": "list",
                    "data": [],
                    "url": "/contacts/5f1afdc24c358c20a4545cdc/notes",
                    "total_count": 0,
                    "has_more": false
                  },
                  "companies": {
                    "type": "list",
                    "data": [],
                    "url": "/contacts/5f1afdc24c358c20a4545cdc/companies",
                    "total_count": 0,
                    "has_more": false
                  }
                }
              ],
              "total_count": 2,
              "pages": {
                "type": "pages",
                "page": 2,
                "per_page": 150,
                "total_pages": 2
              }
            });

          return scope;
        },
        response: { status : "deferred"},
        logs: [
          ["info", "incoming.job.start", {}, { "jobName": "Incoming Data", "type": "webpayload" }],
          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "POST", "url": "/contacts/search", "status": 200, "vars": {} }],
          [
            "debug",
            "incoming.user.success",
            {
              "subject_type": "user",
              "user_email": "lizalead@rei.com",
              "user_external_id": "34235",
              "user_anonymous_id": "intercom:5f161b7a332231fc10b44e5f"
            },
            {
              "data": {
                "type": "contact",
                "id": "5f161b7a332231fc10b44e5f",
                "workspace_id": "lkqcyt9t",
                "external_id": "34235",
                "role": "lead",
                "email": "lizalead@rei.com",
                "phone": null,
                "name": "Liza Lead",
                "avatar": null,
                "owner_id": null,
                "social_profiles": {
                  "type": "list",
                  "data": []
                },
                "has_hard_bounced": false,
                "marked_email_as_spam": false,
                "unsubscribed_from_emails": false,
                "created_at": 1593169501,
                "updated_at": 1593169501,
                "signed_up_at": null,
                "last_seen_at": null,
                "last_replied_at": null,
                "last_contacted_at": null,
                "last_email_opened_at": null,
                "last_email_clicked_at": null,
                "language_override": null,
                "browser": null,
                "browser_version": null,
                "browser_language": null,
                "os": null,
                "location": {
                  "type": "location",
                  "country": null,
                  "region": null,
                  "city": null
                },
                "android_app_name": null,
                "android_app_version": null,
                "android_device": null,
                "android_os_version": null,
                "android_sdk_version": null,
                "android_last_seen_at": null,
                "ios_app_name": null,
                "ios_app_version": null,
                "ios_device": null,
                "ios_os_version": null,
                "ios_sdk_version": null,
                "ios_last_seen_at": null,
                "custom_attributes": {
                  "job_title": "engineer"
                },
                "tags": {
                  "type": "list",
                  "data": [
                    {
                      "id": "4406240",
                      "type": "tag",
                      "url": "/tags/4406240"
                    }
                  ],
                  "url": "/contacts/5f161b7a332231fc10b44e5f/tags",
                  "total_count": 12,
                  "has_more": true
                },
                "notes": {
                  "type": "list",
                  "data": [],
                  "url": "/contacts/5f161b7a332231fc10b44e5f/notes",
                  "total_count": 0,
                  "has_more": false
                },
                "companies": {
                  "type": "list",
                  "data": [
                    {
                      "id": "5f161ef9ce73f3ea2605304e",
                      "type": "company",
                      "url": "/companies/5f161ef9ce73f3ea2605304e"
                    }
                  ],
                  "url": "/contacts/5f161b7a332231fc10b44e5f/companies",
                  "total_count": 1,
                  "has_more": false
                }
              },
              "type": "Lead"
            }
          ],
          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "GET", "url": "/contacts/5f161b7a332231fc10b44e5f/tags", "status": 200, "vars": {} }],
          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "POST", "url": "/contacts/search", "status": 200, "vars": {} }],
          [
            "debug",
            "incoming.user.success",
            {
              "subject_type": "user",
              "user_email": "roberto.hernandez@rei.com",
              "user_anonymous_id": "intercom:5f1afdc24c358c20a4545cdc"
            },
            {
              "data": {
                "type": "contact",
                "id": "5f1afdc24c358c20a4545cdc",
                "workspace_id": "lkqcyt9t",
                "external_id": null,
                "role": "lead",
                "email": "roberto.hernandez@rei.com",
                "phone": null,
                "name": "Roberto Hernandez",
                "avatar": null,
                "owner_id": null,
                "social_profiles": {
                  "type": "list",
                  "data": []
                },
                "has_hard_bounced": false,
                "marked_email_as_spam": false,
                "unsubscribed_from_emails": false,
                "created_at": 1593169501,
                "updated_at": 1593169501,
                "signed_up_at": null,
                "last_seen_at": null,
                "last_replied_at": null,
                "last_contacted_at": null,
                "last_email_opened_at": null,
                "last_email_clicked_at": null,
                "language_override": null,
                "browser": null,
                "browser_version": null,
                "browser_language": null,
                "os": null,
                "location": {
                  "type": "location",
                  "country": null,
                  "region": null,
                  "city": null
                },
                "android_app_name": null,
                "android_app_version": null,
                "android_device": null,
                "android_os_version": null,
                "android_sdk_version": null,
                "android_last_seen_at": null,
                "ios_app_name": null,
                "ios_app_version": null,
                "ios_device": null,
                "ios_os_version": null,
                "ios_sdk_version": null,
                "ios_last_seen_at": null,
                "custom_attributes": {
                  "c_domain": "rei.com"
                },
                "tags": {
                  "type": "list",
                  "data": [],
                  "url": "/contacts/5f1afdc24c358c20a4545cdc/tags",
                  "total_count": 0,
                  "has_more": false
                },
                "notes": {
                  "type": "list",
                  "data": [],
                  "url": "/contacts/5f1afdc24c358c20a4545cdc/notes",
                  "total_count": 0,
                  "has_more": false
                },
                "companies": {
                  "type": "list",
                  "data": [],
                  "url": "/contacts/5f1afdc24c358c20a4545cdc/companies",
                  "total_count": 0,
                  "has_more": false
                }
              },
              "type": "Lead"
            }
          ],
          ["info", "incoming.job.success", {}, { "jobName": "Incoming Data", "type": "webpayload" }]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asUser": {
                "email": "lizalead@rei.com",
                "external_id": "34235",
                "anonymous_id": "intercom:5f161b7a332231fc10b44e5f"
              },
              "subjectType": "user"
            },
            {
              "intercom/tags": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5", "Tag6", "Tag7", "Tag8", "Tag9", "Tag10", "Tag11", "Tag12" ],
              "intercom/job_title": {
                "operation": "set",
                "value": "engineer"
              },
              "intercom/id": {
                "operation": "set",
                "value": "5f161b7a332231fc10b44e5f"
              },
              "name": {
                "operation": "setIfNull",
                "value": "Liza Lead"
              }
            }
          ],
          [
            "traits",
            {
              "asUser": {
                "email": "roberto.hernandez@rei.com",
                "anonymous_id": "intercom:5f1afdc24c358c20a4545cdc"
              },
              "subjectType": "user"
            },
            {
              "intercom/tags": [],
              "intercom/duplicate_domain": {
                "operation": "set",
                "value": "rei.com"
              },
              "intercom/id": {
                "operation": "set",
                "value": "5f1afdc24c358c20a4545cdc"
              },
              "name": {
                "operation": "setIfNull",
                "value": "Roberto Hernandez"
              }
            }
          ]
        ],
        metrics: [
          ["increment", "connector.request", 1],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.whatever()],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.whatever()],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.whatever()]
        ],
        platformApiCalls: [
          ["GET", "/api/v1/app", {}, {}],
          ["GET", "/api/v1/users_segments?shipId=9993743b22d60dd829001999", { "shipId": "9993743b22d60dd829001999" }, {}],
          ["GET", "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999", { "shipId": "9993743b22d60dd829001999" }, {}],
          ["GET", "/api/v1/app", {}, {}],
          [
            "PUT",
            "/api/v1/9993743b22d60dd829001999",
            {},
            {
              "private_settings": {
                "access_token": "12345",
                "fetch_leads": true,
                "leads_last_fetch_timestamp": expect.whatever(),
                "sync_fields_to_hull": [
                  {
                    "name": "job_title",
                    "hull": "traits_intercom/job_title"
                  },
                  {
                    "name": "c_domain",
                    "hull": "traits_intercom/duplicate_domain"
                  }
                ]
              },
              "refresh_status": false
            }
          ]
        ]
      };
    });
  });
});
