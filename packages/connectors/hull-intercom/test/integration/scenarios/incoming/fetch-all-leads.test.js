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
                  "phone": "+1123456789",
                  "name": "Liza",
                  "avatar": "https://example.org/128Wash.jpg",
                  "owner_id": 127,
                  "social_profiles": {
                    "type": "list",
                    "data": [
                      {
                        "type": "social_profile",
                        "name": "Twitter",
                        "url": "http://twitter.com/th1sland"
                      },
                      {
                        "type": "social_profile",
                        "name": "Facebook",
                        "url": "http://facebook.com/th1sland"
                      }
                    ]
                  },
                  "has_hard_bounced": false,
                  "marked_email_as_spam": false,
                  "unsubscribed_from_emails": false,
                  "created_at": 1593169501,
                  "updated_at": 1593169501,
                  "signed_up_at": 1571069751,
                  "last_seen_at": 1571069751,
                  "last_replied_at": 1571672158,
                  "last_contacted_at": 1571672158,
                  "last_email_opened_at": 1571673478,
                  "last_email_clicked_at": 1571676789,
                  "language_override": null,
                  "browser": "chrome",
                  "browser_version": "77.0.3865.90",
                  "browser_language": "en",
                  "os": "OS X 10.14.6",
                  "location": {
                    "type": "location",
                    "country": "United States",
                    "region": "Georgia",
                    "city": "Atlanta"
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
                    "total_count": 10,
                    "has_more": true
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
            .get("/contacts/5f161b7a332231fc10b44e5f/companies")
            .reply(200, {
              "type": "list",
              "data": [
                { "name": "Company1" },
                { "name": "Company2" },
                { "name": "Company3" }
              ],
              "pages": {
                "type": "pages",
                "next": null,
                "page": 1,
                "per_page": 50,
                "total_pages": 1
              },
              "total_count": 1
            });

          scope
            .get("/contacts/5f161b7a332231fc10b44e5f/segments")
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

          scope
            .get("/contacts/5f1afdc24c358c20a4545cdc/segments")
            .reply(200, {
              "type": "list",
              "data": []
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
                "phone": "+1123456789",
                "name": "Liza",
                "avatar": "https://example.org/128Wash.jpg",
                "owner_id": 127,
                "social_profiles": {
                  "type": "list",
                  "data": [
                    {
                      "type": "social_profile",
                      "name": "Twitter",
                      "url": "http://twitter.com/th1sland"
                    },
                    {
                      "type": "social_profile",
                      "name": "Facebook",
                      "url": "http://facebook.com/th1sland"
                    }
                  ]
                },
                "has_hard_bounced": false,
                "marked_email_as_spam": false,
                "unsubscribed_from_emails": false,
                "created_at": 1593169501,
                "updated_at": 1593169501,
                "signed_up_at": 1571069751,
                "last_seen_at": 1571069751,
                "last_replied_at": 1571672158,
                "last_contacted_at": 1571672158,
                "last_email_opened_at": 1571673478,
                "last_email_clicked_at": 1571676789,
                "language_override": null,
                "browser": "chrome",
                "browser_version": "77.0.3865.90",
                "browser_language": "en",
                "os": "OS X 10.14.6",
                "location": {
                  "type": "location",
                  "country": "United States",
                  "region": "Georgia",
                  "city": "Atlanta"
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
                  "total_count": 10,
                  "has_more": true
                }
              },
              "type": "Lead"
            }
          ],
          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "GET", "url": "/contacts/5f161b7a332231fc10b44e5f/tags", "status": 200, "vars": {} }],
          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "GET", "url": "/contacts/5f161b7a332231fc10b44e5f/companies", "status": 200, "vars": {} }],
          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "GET", "url": "/contacts/5f161b7a332231fc10b44e5f/segments", "status": 200, "vars": {} }],
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
          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "GET", "url": "/contacts/5f1afdc24c358c20a4545cdc/segments", "status": 200, "vars": {} }],
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
              "email": {
                "operation": "setIfNull",
                "value": "lizalead@rei.com"
              },
              "intercom/email": {
                "operation": "setIfNull",
                "value": "lizalead@rei.com"
              },
              "intercom/id": {
                "operation": "setIfNull",
                "value": "5f161b7a332231fc10b44e5f"
              },
              "external_id": {
                "operation": "setIfNull",
                "value": "34235"
              },
              "intercom/user_id": {
                "operation": "setIfNull",
                "value": "34235"
              },
              "intercom/twitter_url": {
                "operation": "setIfNull",
                "value": "http://twitter.com/th1sland"
              },
              "intercom/facebook_url": {
                "operation": "setIfNull",
                "value": "http://facebook.com/th1sland"
              },
              "intercom/social_profiles": {
                "operation": "setIfNull",
                "value": [
                  "http://twitter.com/th1sland",
                  "http://facebook.com/th1sland"
                ]
              },
              "intercom/phone": {
                "operation": "setIfNull",
                "value": "+1123456789"
              },
              "intercom/name": {
                "operation": "setIfNull",
                "value": "Liza"
              },
              "intercom/avatar": {
                "operation": "setIfNull",
                "value": "https://example.org/128Wash.jpg"
              },
              "intercom/owner_id": {
                "operation": "setIfNull",
                "value": 127
              },
              "intercom/has_hard_bounced": {
                "operation": "setIfNull",
                "value": false
              },
              "intercom/marked_email_as_spam": {
                "operation": "setIfNull",
                "value": false
              },
              "intercom/unsubscribed_from_emails": {
                "operation": "setIfNull",
                "value": false
              },
              "intercom/created_at": {
                "operation": "setIfNull",
                "value": 1593169501
              },
              "intercom/updated_at": {
                "operation": "setIfNull",
                "value": 1593169501
              },
              "intercom/segments": {
                "operation": "setIfNull",
                "value": ["Segment1", "Segment2"]
              },
              "intercom/signed_up_at": {
                "operation": "setIfNull",
                "value": 1571069751
              },
              "intercom/last_seen_at": {
                "operation": "setIfNull",
                "value": 1571069751
              },
              "intercom/last_replied_at": {
                "operation": "setIfNull",
                "value": 1571672158
              },
              "intercom/last_contacted_at": {
                "operation": "setIfNull",
                "value": 1571672158
              },
              "intercom/last_email_opened_at": {
                "operation": "setIfNull",
                "value": 1571673478
              },
              "intercom/last_email_clicked_at": {
                "operation": "setIfNull",
                "value": 1571676789
              },
              "intercom/language_override": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/browser": {
                "operation": "setIfNull",
                "value": "chrome"
              },
              "intercom/browser_version": {
                "operation": "setIfNull",
                "value": "77.0.3865.90"
              },
              "intercom/browser_language": {
                "operation": "setIfNull",
                "value": "en"
              },
              "intercom/os": {
                "operation": "setIfNull",
                "value": "OS X 10.14.6"
              },
              "intercom/location_country_name": {
                "operation": "setIfNull",
                "value": "United States"
              },
              "intercom/location_region_name": {
                "operation": "setIfNull",
                "value": "Georgia"
              },
              "intercom/location_city_name": {
                "operation": "setIfNull",
                "value": "Atlanta"
              },
              "intercom/tags": {
                "operation": "setIfNull",
                "value": [
                  "Tag1",
                  "Tag2",
                  "Tag3",
                  "Tag4",
                  "Tag5",
                  "Tag6",
                  "Tag7",
                  "Tag8",
                  "Tag9",
                  "Tag10",
                  "Tag11",
                  "Tag12"
                ]
              },
              "intercom/companies": {
                "operation": "setIfNull",
                "value": [
                  "Company1",
                  "Company2",
                  "Company3"
                ]
              },
              "intercom/job_title": {
                "operation": "setIfNull",
                "value": "engineer"
              },
              "name": {
                "operation": "setIfNull",
                "value": "Liza"
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
              "email": {
                "operation": "setIfNull",
                "value": "roberto.hernandez@rei.com"
              },
              "intercom/email": {
                "operation": "setIfNull",
                "value": "roberto.hernandez@rei.com"
              },
              "intercom/id": {
                "operation": "setIfNull",
                "value": "5f1afdc24c358c20a4545cdc"
              },
              "external_id": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/user_id": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/phone": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/name": {
                "operation": "setIfNull",
                "value": "Roberto Hernandez"
              },
              "intercom/avatar": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/owner_id": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/has_hard_bounced": {
                "operation": "setIfNull",
                "value": false
              },
              "intercom/marked_email_as_spam": {
                "operation": "setIfNull",
                "value": false
              },
              "intercom/unsubscribed_from_emails": {
                "operation": "setIfNull",
                "value": false
              },
              "intercom/created_at": {
                "operation": "setIfNull",
                "value": 1593169501
              },
              "intercom/updated_at": {
                "operation": "setIfNull",
                "value": 1593169501
              },
              "intercom/segments": {
                "operation": "setIfNull",
                "value": []
              },
              "intercom/social_profiles": {
                "operation": "setIfNull",
                "value": []
              },
              "intercom/signed_up_at": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/last_seen_at": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/last_replied_at": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/last_contacted_at": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/last_email_opened_at": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/last_email_clicked_at": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/language_override": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/browser": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/browser_version": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/browser_language": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/os": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/location_country_name": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/location_region_name": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/location_city_name": {
                "operation": "setIfNull",
                "value": null
              },
              "intercom/tags": {
                "operation": "setIfNull",
                "value": []
              },
              "intercom/companies": {
                "operation": "setIfNull",
                "value": []
              },
              "intercom/duplicate_domain": {
                "operation": "setIfNull",
                "value": "rei.com"
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
          ["value", "connector.service_api.response_time", expect.whatever()],
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
