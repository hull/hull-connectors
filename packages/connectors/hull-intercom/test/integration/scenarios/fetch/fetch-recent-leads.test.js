// @flow
import connectorConfig from "../../../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";
process.env.COMBINED = true;

describe("Fetch Recent Leads Tests", () => {

  it("should fetch recent leads", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "fetch-recent-leads",
        connector: {
          private_settings: {
            webhook_id: "1",
            access_token: "12345",
            fetch_leads: true,
            leads_last_fetch_timestamp: 1593169500,
            user_claims: [
              { hull: 'email', service: 'email' },
              { hull: 'external_id', service: 'external_id' }
            ],
            lead_claims: [
              { hull: 'email', service: 'email' }
            ],
            incoming_lead_attributes: [
              { service: 'external_id', hull: 'intercom_lead/user_id', readOnly: true, overwrite: true },
              { service: 'id', hull: 'intercom_lead/id', readOnly: true, overwrite: true },
              { service: 'email', hull: 'intercom_lead/email', readOnly: true, overwrite: true },
              { service: 'avatar', hull: 'intercom_lead/avatar', overwrite: true },
              { service: 'browser', hull: 'intercom_lead/browser', overwrite: true },
              { service: 'browser_language', hull: 'intercom_lead/browser_language', overwrite: true },
              { service: 'browser_version', hull: 'intercom_lead/browser_version', overwrite: true },
              { service: 'companies', hull: 'intercom_lead/companies', overwrite: true },
              { service: 'created_at', hull: 'intercom_lead/created_at', overwrite: true },
              { service: 'has_hard_bounced', hull: 'intercom_lead/has_hard_bounced', overwrite: true },
              { service: 'language_override', hull: 'intercom_lead/language_override', overwrite: true },
              { service: 'last_contacted_at', hull: 'intercom_lead/last_contacted_at', overwrite: true },
              { service: 'last_email_clicked_at', hull: 'intercom_lead/last_email_clicked_at', overwrite: true },
              { service: 'last_email_opened_at', hull: 'intercom_lead/last_email_opened_at', overwrite: true },
              { service: 'last_replied_at', hull: 'intercom_lead/last_replied_at', overwrite: true },
              { service: 'last_seen_at', hull: 'intercom_lead/last_seen_at', overwrite: true },
              { service: 'location.city', hull: 'intercom_lead/location_city_name', overwrite: true },
              { service: 'location.country', hull: 'intercom_lead/location_country_name', overwrite: true },
              { service: 'location.region', hull: 'intercom_lead/location_region_name', overwrite: true },
              { service: 'marked_email_as_spam', hull: 'intercom_lead/marked_email_as_spam', overwrite: true },
              { service: 'name', hull: 'intercom_lead/name', overwrite: true },
              { service: 'os', hull: 'intercom_lead/os', overwrite: true },
              { service: 'owner_id', hull: 'intercom_lead/owner_id', overwrite: true },
              { service: 'phone', hull: 'intercom_lead/phone', overwrite: true },
              { service: 'segments', hull: 'intercom_lead/segments', overwrite: true },
              { service: 'signed_up_at', hull: 'intercom_lead/signed_up_at', overwrite: true },
              { service: 'social_profiles', hull: 'intercom_lead/social_profiles', overwrite: true },
              { service: 'tags', hull: 'intercom_lead/tags', overwrite: true },
              { service: 'unsubscribed_from_emails', hull: 'intercom_lead/unsubscribed_from_emails', overwrite: true },
              { service: 'updated_at', hull: 'intercom_lead/updated_at', overwrite: true },
              { service: 'custom_attributes.department', hull: 'traits_intercom_lead/c_department', overwrite: true },
              { service: 'custom_attributes.job_title', hull: 'traits_intercom_lead/job_title', overwrite: true },
              { service: 'custom_attributes.c_domain', hull: 'traits_intercom_lead/duplicate_domain', overwrite: true }
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
                    "value": 1593083100
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
                  "external_id": "lead_user_id_1",
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
                    "department": "integrations",
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
                    "value": 1593083100
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
                  "external_id": "lead_user_id_2",
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
                {
                  "type": "contact",
                  "id": "skippinglead",
                  "workspace_id": "lkqcyt9t",
                  "external_id": null,
                  "role": "lead",
                  "email": "skipping-lead@rei.com",
                  "phone": null,
                  "name": "Skipping Lead",
                  "avatar": null,
                  "owner_id": null,
                  "social_profiles": {
                    "type": "list",
                    "data": []
                  },
                  "has_hard_bounced": false,
                  "marked_email_as_spam": false,
                  "unsubscribed_from_emails": false,
                  "created_at": 1593169499,
                  "updated_at": 1593169499,
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
                    "url": "/contacts/skippingcontact/tags",
                    "total_count": 0,
                    "has_more": false
                  },
                  "notes": {
                    "type": "list",
                    "data": [],
                    "url": "/contacts/skippingcontact/notes",
                    "total_count": 0,
                    "has_more": false
                  },
                  "companies": {
                    "type": "list",
                    "data": [],
                    "url": "/contacts/skippingcontact/companies",
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
          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "GET", "url": "/contacts/5f161b7a332231fc10b44e5f/companies", "status": 200, "vars": {} }],
          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "GET", "url": "/contacts/5f161b7a332231fc10b44e5f/segments", "status": 200, "vars": {} }],
          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "GET", "url": "/contacts/5f161b7a332231fc10b44e5f/tags", "status": 200, "vars": {} }],
          [
            "debug",
            "incoming.user.success",
            {
              "subject_type": "user",
              "user_email": "lizalead@rei.com",
              "user_anonymous_id": "intercom-lead:lead-5f161b7a332231fc10b44e5f"
            },
            {
              "data": {
                "type": "contact",
                "id": "5f161b7a332231fc10b44e5f",
                "workspace_id": "lkqcyt9t",
                "external_id": "lead_user_id_1",
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
                  "department": "integrations",
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
            "method": "POST", "url": "/contacts/search", "status": 200, "vars": {} }],
          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "GET", "url": "/contacts/5f1afdc24c358c20a4545cdc/segments", "status": 200, "vars": {} }],
          [
            "debug",
            "incoming.user.success",
            {
              "subject_type": "user",
              "user_email": "roberto.hernandez@rei.com",
              "user_anonymous_id": "intercom-lead:lead-5f1afdc24c358c20a4545cdc"
            },
            {
              "data": {
                "type": "contact",
                "id": "5f1afdc24c358c20a4545cdc",
                "workspace_id": "lkqcyt9t",
                "external_id": "lead_user_id_2",
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
                "anonymous_id": "intercom-lead:lead-5f161b7a332231fc10b44e5f"
              },
              "subjectType": "user"
            },
            {
              "name": {
                "operation": "setIfNull",
                "value": "Liza"
              },
              "intercom_lead/email": {
                "operation": "set",
                "value": "lizalead@rei.com"
              },
              "intercom_lead/id": {
                "operation": "set",
                "value": "5f161b7a332231fc10b44e5f"
              },
              "intercom_lead/user_id": {
                "operation": "set",
                "value": "lead_user_id_1"
              },
              "intercom_lead/twitter_url": {
                "operation": "set",
                "value": "http://twitter.com/th1sland"
              },
              "intercom_lead/facebook_url": {
                "operation": "set",
                "value": "http://facebook.com/th1sland"
              },
              "intercom_lead/social_profiles": {
                "operation": "set",
                "value": [
                  "http://twitter.com/th1sland",
                  "http://facebook.com/th1sland"
                ]
              },
              "intercom_lead/phone": {
                "operation": "set",
                "value": "+1123456789"
              },
              "intercom_lead/name": {
                "operation": "set",
                "value": "Liza"
              },
              "intercom_lead/avatar": {
                "operation": "set",
                "value": "https://example.org/128Wash.jpg"
              },
              "intercom_lead/owner_id": {
                "operation": "set",
                "value": 127
              },
              "intercom_lead/has_hard_bounced": {
                "operation": "set",
                "value": false
              },
              "intercom_lead/marked_email_as_spam": {
                "operation": "set",
                "value": false
              },
              "intercom_lead/unsubscribed_from_emails": {
                "operation": "set",
                "value": false
              },
              "intercom_lead/created_at": {
                "operation": "set",
                "value": 1593169501
              },
              "intercom_lead/updated_at": {
                "operation": "set",
                "value": 1593169501
              },
              "intercom_lead/segments": {
                "operation": "set",
                "value": ["Segment1", "Segment2"]
              },
              "intercom_lead/signed_up_at": {
                "operation": "set",
                "value": 1571069751
              },
              "intercom_lead/last_seen_at": {
                "operation": "set",
                "value": 1571069751
              },
              "intercom_lead/last_replied_at": {
                "operation": "set",
                "value": 1571672158
              },
              "intercom_lead/last_contacted_at": {
                "operation": "set",
                "value": 1571672158
              },
              "intercom_lead/last_email_opened_at": {
                "operation": "set",
                "value": 1571673478
              },
              "intercom_lead/last_email_clicked_at": {
                "operation": "set",
                "value": 1571676789
              },
              "intercom_lead/language_override": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/browser": {
                "operation": "set",
                "value": "chrome"
              },
              "intercom_lead/browser_version": {
                "operation": "set",
                "value": "77.0.3865.90"
              },
              "intercom_lead/browser_language": {
                "operation": "set",
                "value": "en"
              },
              "intercom_lead/os": {
                "operation": "set",
                "value": "OS X 10.14.6"
              },
              "intercom_lead/location_country_name": {
                "operation": "set",
                "value": "United States"
              },
              "intercom_lead/location_region_name": {
                "operation": "set",
                "value": "Georgia"
              },
              "intercom_lead/location_city_name": {
                "operation": "set",
                "value": "Atlanta"
              },
              "intercom_lead/tags": {
                "operation": "set",
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
              "intercom_lead/companies": {
                "operation": "set",
                "value": [
                  "Company1",
                  "Company2",
                  "Company3"
                ]
              },
              "intercom_lead/c_department": {
                "operation": "set",
                "value": "integrations"
              },
              "intercom_lead/job_title": {
                "operation": "set",
                "value": "engineer"
              }
            }
          ],
          [
            "traits",
            {
              "asUser": {
                "email": "roberto.hernandez@rei.com",
                "anonymous_id": "intercom-lead:lead-5f1afdc24c358c20a4545cdc"
              },
              "subjectType": "user"
            },
            {
              "intercom_lead/email": {
                "operation": "set",
                "value": "roberto.hernandez@rei.com"
              },
              "intercom_lead/id": {
                "operation": "set",
                "value": "5f1afdc24c358c20a4545cdc"
              },
              "intercom_lead/user_id": {
                "operation": "set",
                "value": "lead_user_id_2"
              },
              "intercom_lead/phone": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/name": {
                "operation": "set",
                "value": "Roberto Hernandez"
              },
              "intercom_lead/avatar": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/owner_id": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/has_hard_bounced": {
                "operation": "set",
                "value": false
              },
              "intercom_lead/marked_email_as_spam": {
                "operation": "set",
                "value": false
              },
              "intercom_lead/unsubscribed_from_emails": {
                "operation": "set",
                "value": false
              },
              "intercom_lead/created_at": {
                "operation": "set",
                "value": 1593169501
              },
              "intercom_lead/updated_at": {
                "operation": "set",
                "value": 1593169501
              },
              "intercom_lead/segments": {
                "operation": "set",
                "value": []
              },
              "intercom_lead/social_profiles": {
                "operation": "set",
                "value": []
              },
              "intercom_lead/signed_up_at": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/last_seen_at": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/last_replied_at": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/last_contacted_at": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/last_email_opened_at": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/last_email_clicked_at": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/language_override": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/browser": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/browser_version": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/browser_language": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/os": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/location_country_name": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/location_region_name": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/location_city_name": {
                "operation": "set",
                "value": null
              },
              "intercom_lead/tags": {
                "operation": "set",
                "value": []
              },
              "intercom_lead/companies": {
                "operation": "set",
                "value": []
              },
              "intercom_lead/duplicate_domain": {
                "operation": "set",
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
          [
            "PUT",
            "/api/v1/9993743b22d60dd829001999",
            {},
            expect.objectContaining({"private_settings": expect.whatever()})
          ]
        ]
      };
    });
  });
});
