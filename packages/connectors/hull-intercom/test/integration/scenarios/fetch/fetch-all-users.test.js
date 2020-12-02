// @flow
import connectorConfig from "../../../../server/config";
import manifest from "../../../../manifest.json";
const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";

describe("Fetch All Users Tests", () => {

  it("should fetch all users", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.jsonHandler,
        handlerUrl: "fetchAllUsers",
        connector: {
          private_settings: {
            link_users_in_hull: true,
            link_users_in_service: true,
            webhook_id: "1",
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
              { "service": "companies", "hull": "intercom_user/companies", "overwrite": true },
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
              { "service": "segments", "hull": "intercom_user/segments", "overwrite": true },
              { "service": "signed_up_at", "hull": "intercom_user/signed_up_at", "overwrite": true },
              { "service": "social_profiles", "hull": "intercom_user/social_profiles", "overwrite": true },
              { "service": "tags", "hull": "intercom_user/tags", "overwrite": true },
              { "service": "unsubscribed_from_emails", "hull": "intercom_user/unsubscribed_from_emails", "overwrite": true },
              { "service": "updated_at", "hull": "intercom_user/updated_at", "overwrite": true },
              { "service": 'custom_attributes.job title', "hull": 'traits_intercom_user/job_title', "overwrite": true  },
              { "service": 'custom_attributes.c_domain', "hull": 'traits_intercom_user/duplicate_domain', "overwrite": true }
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
                    "value": "user"
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
                  "external_id": "user_id_1",
                  "role": "user",
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
                    "job title": "engineer"
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
                {
                  "type": "contact",
                  "id": "2",
                  "workspace_id": "lkqcyt9t",
                  "external_id": "user_id_2",
                  "role": "user",
                  "email": "lizalead2@rei.com",
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
                    "job title": "engineer"
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
                {
                  "type": "contact",
                  "id": "3",
                  "workspace_id": "lkqcyt9t",
                  "external_id": "user_id_3",
                  "role": "user",
                  "email": "lizalead3@rei.com",
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
                    "job title": "engineer"
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
                { "type": "tag", "id": "4406239", "name": "Tag12" }
              ]
            });

          scope
            .get("/contacts/2/tags")
            .reply(200, {
              "type": "list",
              "data": [
                { "type": "tag", "id": "4406234", "name": "Tag13" },
                { "type": "tag", "id": "4406229", "name": "Tag14" }
              ]
            });

          scope
            .get("/contacts/3/tags")
            .reply(200, {
              "type": "list",
              "data": [
                { "type": "tag", "id": "4406234", "name": "Tag15" },
                { "type": "tag", "id": "4406229", "name": "Tag16" }
              ]
            });

          scope
            .get("/contacts/5f161b7a332231fc10b44e5f/companies")
            .reply(200, {
              "type": "list",
              "data": [
                { "name": "Company1", "id": "company_1" }
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
            .get("/contacts/2/companies")
            .reply(200, {
              "type": "list",
              "data": [
                { "name": "Company4", "id": "company_4", },
                { "name": "Company5", "id": "company_5" },
                { "name": "Company6", "id": "company_6" }
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
            .get("/contacts/3/companies")
            .reply(200, {
              "type": "list",
              "data": [
                { "name": "Company7", "id": "company_7", },
                { "name": "Company8", "id": "company_8" },
                { "name": "Company9", "id": "company_9" }
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
            .get("/contacts/2/segments")
            .reply(200, {
              "type": "list",
              "data": [
                {
                  "type": "segment",
                  "id": "5d2640faa76403cb13d73c2f",
                  "name": "Segment3",
                  "created_at": 1562788090,
                  "updated_at": 1595788749,
                  "person_type": "user"
                },
                {
                  "type": "segment",
                  "id": "5dd30458939b587add11f1aa",
                  "name": "Segment4",
                  "created_at": 1574110296,
                  "updated_at": 1595795580,
                  "person_type": "user"
                }
              ]
            });

          scope
            .get("/contacts/3/segments")
            .reply(200, {
              "type": "list",
              "data": [
                {
                  "type": "segment",
                  "id": "5d2640faa76403cb13d73c2f",
                  "name": "Segment5",
                  "created_at": 1562788090,
                  "updated_at": 1595788749,
                  "person_type": "user"
                },
                {
                  "type": "segment",
                  "id": "5dd30458939b587add11f1aa",
                  "name": "Segment6",
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
                    "value": "user"
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
                  "role": "user",
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
          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "GET", "url": "/contacts/5f161b7a332231fc10b44e5f/companies", "status": 200, "vars": {} }],
          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "GET", "url": "/contacts/5f161b7a332231fc10b44e5f/segments", "status": 200, "vars": {} }],
          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "GET", "url": "/contacts/5f161b7a332231fc10b44e5f/tags", "status": 200, "vars": {} }],

          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "GET", "url": "/contacts/2/companies", "status": 200, "vars": {} }],
          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "GET", "url": "/contacts/2/segments", "status": 200, "vars": {} }],
          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "GET", "url": "/contacts/2/tags", "status": 200, "vars": {} }],

          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "GET", "url": "/contacts/3/companies", "status": 200, "vars": {} }],
          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "GET", "url": "/contacts/3/segments", "status": 200, "vars": {} }],
          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "GET", "url": "/contacts/3/tags", "status": 200, "vars": {} }],
          [
            "debug",
            "incoming.user.success",
            {
              "subject_type": "user",
              "user_email": "lizalead@rei.com",
              "user_external_id": "user_id_1",
              "user_anonymous_id": "intercom-user:user-5f161b7a332231fc10b44e5f"
            },
            {
              "data": {
                "type": "contact",
                "id": "5f161b7a332231fc10b44e5f",
                "workspace_id": "lkqcyt9t",
                "external_id": "user_id_1",
                "role": "user",
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
                  "job title": "engineer"
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
              "type": "User"
            }
          ],
          [
            "debug",
            "incoming.user.success",
            {
              "subject_type": "user",
              "user_email": "lizalead2@rei.com",
              "user_external_id": "user_id_2",
              "user_anonymous_id": "intercom-user:user-2"
            },
            {
              "data": {
                "type": "contact",
                "id": "2",
                "workspace_id": "lkqcyt9t",
                "external_id": "user_id_2",
                "role": "user",
                "email": "lizalead2@rei.com",
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
                  "job title": "engineer"
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
              "type": "User"
            }
          ],
          [
            "debug",
            "incoming.user.success",
            {
              "subject_type": "user",
              "user_email": "lizalead3@rei.com",
              "user_external_id": "user_id_3",
              "user_anonymous_id": "intercom-user:user-3"
            },
            {
              "data": {
                "type": "contact",
                "id": "3",
                "workspace_id": "lkqcyt9t",
                "external_id": "user_id_3",
                "role": "user",
                "email": "lizalead3@rei.com",
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
                  "job title": "engineer"
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
              "type": "User"
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
              "user_anonymous_id": "intercom-user:user-5f1afdc24c358c20a4545cdc"
            },
            {
              "data": {
                "type": "contact",
                "id": "5f1afdc24c358c20a4545cdc",
                "workspace_id": "lkqcyt9t",
                "external_id": null,
                "role": "user",
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
              "type": "User"
            }
          ],
          ["info", "incoming.job.success", {}, { "jobName": "Incoming Data", "type": "webpayload" }]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asUser": {
                "email": "lizalead2@rei.com",
                "external_id": "user_id_2",
                "anonymous_id": "intercom-user:user-2"
              },
              "subjectType": "user"
            },
            {
              "intercom_user/email": {
                "operation": "set",
                "value": "lizalead2@rei.com"
              },
              "intercom_user/id": {
                "operation": "set",
                "value": "2"
              },
              "intercom_user/user_id": {
                "operation": "set",
                "value": "user_id_2"
              },
              "intercom_user/twitter_url": {
                "operation": "set",
                "value": "http://twitter.com/th1sland"
              },
              "intercom_user/facebook_url": {
                "operation": "set",
                "value": "http://facebook.com/th1sland"
              },
              "intercom_user/social_profiles": {
                "operation": "set",
                "value": [
                  "http://twitter.com/th1sland",
                  "http://facebook.com/th1sland"
                ]
              },
              "intercom_user/phone": {
                "operation": "set",
                "value": "+1123456789"
              },
              "intercom_user/name": {
                "operation": "set",
                "value": "Liza"
              },
              "intercom_user/avatar": {
                "operation": "set",
                "value": "https://example.org/128Wash.jpg"
              },
              "intercom_user/owner_id": {
                "operation": "set",
                "value": 127
              },
              "intercom_user/has_hard_bounced": {
                "operation": "set",
                "value": false
              },
              "intercom_user/marked_email_as_spam": {
                "operation": "set",
                "value": false
              },
              "intercom_user/unsubscribed_from_emails": {
                "operation": "set",
                "value": false
              },
              "intercom_user/created_at": {
                "operation": "set",
                "value": 1593169501
              },
              "intercom_user/updated_at": {
                "operation": "set",
                "value": 1593169501
              },
              "intercom_user/segments": {
                "operation": "set",
                "value": ["Segment3", "Segment4"]
              },
              "intercom_user/signed_up_at": {
                "operation": "set",
                "value": 1571069751
              },
              "intercom_user/last_seen_at": {
                "operation": "set",
                "value": 1571069751
              },
              "intercom_user/last_replied_at": {
                "operation": "set",
                "value": 1571672158
              },
              "intercom_user/last_contacted_at": {
                "operation": "set",
                "value": 1571672158
              },
              "intercom_user/last_email_opened_at": {
                "operation": "set",
                "value": 1571673478
              },
              "intercom_user/last_email_clicked_at": {
                "operation": "set",
                "value": 1571676789
              },
              "intercom_user/language_override": {
                "operation": "set",
                "value": null
              },
              "intercom_user/browser": {
                "operation": "set",
                "value": "chrome"
              },
              "intercom_user/browser_version": {
                "operation": "set",
                "value": "77.0.3865.90"
              },
              "intercom_user/browser_language": {
                "operation": "set",
                "value": "en"
              },
              "intercom_user/os": {
                "operation": "set",
                "value": "OS X 10.14.6"
              },
              "intercom_user/location_country_name": {
                "operation": "set",
                "value": "United States"
              },
              "intercom_user/location_region_name": {
                "operation": "set",
                "value": "Georgia"
              },
              "intercom_user/location_city_name": {
                "operation": "set",
                "value": "Atlanta"
              },
              "intercom_user/tags": {
                "operation": "set",
                "value": [
                  "Tag13",
                  "Tag14"
                ]
              },
              "intercom_user/companies": {
                "operation": "set",
                "value": [
                  "Company4",
                  "Company5",
                  "Company6"
                ]
              },
              "intercom_user/job_title": {
                "operation": "set",
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
                "email": "lizalead3@rei.com",
                "external_id": "user_id_3",
                "anonymous_id": "intercom-user:user-3"
              },
              "subjectType": "user"
            },
            {
              "intercom_user/email": {
                "operation": "set",
                "value": "lizalead3@rei.com"
              },
              "intercom_user/id": {
                "operation": "set",
                "value": "3"
              },
              "intercom_user/user_id": {
                "operation": "set",
                "value": "user_id_3"
              },
              "intercom_user/twitter_url": {
                "operation": "set",
                "value": "http://twitter.com/th1sland"
              },
              "intercom_user/facebook_url": {
                "operation": "set",
                "value": "http://facebook.com/th1sland"
              },
              "intercom_user/social_profiles": {
                "operation": "set",
                "value": [
                  "http://twitter.com/th1sland",
                  "http://facebook.com/th1sland"
                ]
              },
              "intercom_user/phone": {
                "operation": "set",
                "value": "+1123456789"
              },
              "intercom_user/name": {
                "operation": "set",
                "value": "Liza"
              },
              "intercom_user/avatar": {
                "operation": "set",
                "value": "https://example.org/128Wash.jpg"
              },
              "intercom_user/owner_id": {
                "operation": "set",
                "value": 127
              },
              "intercom_user/has_hard_bounced": {
                "operation": "set",
                "value": false
              },
              "intercom_user/marked_email_as_spam": {
                "operation": "set",
                "value": false
              },
              "intercom_user/unsubscribed_from_emails": {
                "operation": "set",
                "value": false
              },
              "intercom_user/created_at": {
                "operation": "set",
                "value": 1593169501
              },
              "intercom_user/updated_at": {
                "operation": "set",
                "value": 1593169501
              },
              "intercom_user/segments": {
                "operation": "set",
                "value": ["Segment5", "Segment6"]
              },
              "intercom_user/signed_up_at": {
                "operation": "set",
                "value": 1571069751
              },
              "intercom_user/last_seen_at": {
                "operation": "set",
                "value": 1571069751
              },
              "intercom_user/last_replied_at": {
                "operation": "set",
                "value": 1571672158
              },
              "intercom_user/last_contacted_at": {
                "operation": "set",
                "value": 1571672158
              },
              "intercom_user/last_email_opened_at": {
                "operation": "set",
                "value": 1571673478
              },
              "intercom_user/last_email_clicked_at": {
                "operation": "set",
                "value": 1571676789
              },
              "intercom_user/language_override": {
                "operation": "set",
                "value": null
              },
              "intercom_user/browser": {
                "operation": "set",
                "value": "chrome"
              },
              "intercom_user/browser_version": {
                "operation": "set",
                "value": "77.0.3865.90"
              },
              "intercom_user/browser_language": {
                "operation": "set",
                "value": "en"
              },
              "intercom_user/os": {
                "operation": "set",
                "value": "OS X 10.14.6"
              },
              "intercom_user/location_country_name": {
                "operation": "set",
                "value": "United States"
              },
              "intercom_user/location_region_name": {
                "operation": "set",
                "value": "Georgia"
              },
              "intercom_user/location_city_name": {
                "operation": "set",
                "value": "Atlanta"
              },
              "intercom_user/tags": {
                "operation": "set",
                "value": [
                  "Tag15",
                  "Tag16"
                ]
              },
              "intercom_user/companies": {
                "operation": "set",
                "value": [
                  "Company7",
                  "Company8",
                  "Company9"
                ]
              },
              "intercom_user/job_title": {
                "operation": "set",
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
                "email": "lizalead@rei.com",
                "external_id": "user_id_1",
                "anonymous_id": "intercom-user:user-5f161b7a332231fc10b44e5f"
              },
              "subjectType": "user"
            },
            {
              "intercom_user/email": {
                "operation": "set",
                "value": "lizalead@rei.com"
              },
              "intercom_user/id": {
                "operation": "set",
                "value": "5f161b7a332231fc10b44e5f"
              },
              "intercom_user/user_id": {
                "operation": "set",
                "value": "user_id_1"
              },
              "intercom_user/twitter_url": {
                "operation": "set",
                "value": "http://twitter.com/th1sland"
              },
              "intercom_user/facebook_url": {
                "operation": "set",
                "value": "http://facebook.com/th1sland"
              },
              "intercom_user/social_profiles": {
                "operation": "set",
                "value": [
                  "http://twitter.com/th1sland",
                  "http://facebook.com/th1sland"
                ]
              },
              "intercom_user/phone": {
                "operation": "set",
                "value": "+1123456789"
              },
              "intercom_user/name": {
                "operation": "set",
                "value": "Liza"
              },
              "intercom_user/avatar": {
                "operation": "set",
                "value": "https://example.org/128Wash.jpg"
              },
              "intercom_user/owner_id": {
                "operation": "set",
                "value": 127
              },
              "intercom_user/has_hard_bounced": {
                "operation": "set",
                "value": false
              },
              "intercom_user/marked_email_as_spam": {
                "operation": "set",
                "value": false
              },
              "intercom_user/unsubscribed_from_emails": {
                "operation": "set",
                "value": false
              },
              "intercom_user/created_at": {
                "operation": "set",
                "value": 1593169501
              },
              "intercom_user/updated_at": {
                "operation": "set",
                "value": 1593169501
              },
              "intercom_user/segments": {
                "operation": "set",
                "value": ["Segment1", "Segment2"]
              },
              "intercom_user/signed_up_at": {
                "operation": "set",
                "value": 1571069751
              },
              "intercom_user/last_seen_at": {
                "operation": "set",
                "value": 1571069751
              },
              "intercom_user/last_replied_at": {
                "operation": "set",
                "value": 1571672158
              },
              "intercom_user/last_contacted_at": {
                "operation": "set",
                "value": 1571672158
              },
              "intercom_user/last_email_opened_at": {
                "operation": "set",
                "value": 1571673478
              },
              "intercom_user/last_email_clicked_at": {
                "operation": "set",
                "value": 1571676789
              },
              "intercom_user/language_override": {
                "operation": "set",
                "value": null
              },
              "intercom_user/browser": {
                "operation": "set",
                "value": "chrome"
              },
              "intercom_user/browser_version": {
                "operation": "set",
                "value": "77.0.3865.90"
              },
              "intercom_user/browser_language": {
                "operation": "set",
                "value": "en"
              },
              "intercom_user/os": {
                "operation": "set",
                "value": "OS X 10.14.6"
              },
              "intercom_user/location_country_name": {
                "operation": "set",
                "value": "United States"
              },
              "intercom_user/location_region_name": {
                "operation": "set",
                "value": "Georgia"
              },
              "intercom_user/location_city_name": {
                "operation": "set",
                "value": "Atlanta"
              },
              "intercom_user/tags": {
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
              "intercom_user/companies": {
                "operation": "set",
                "value": [
                  "Company1"
                ]
              },
              "intercom_user/job_title": {
                "operation": "set",
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
              "asAccount": {
                "anonymous_id": "intercom:company_1"
              },
              "asUser": {
                "email": "lizalead@rei.com",
                "external_id": "user_id_1",
                "anonymous_id": "intercom-user:user-5f161b7a332231fc10b44e5f"
              },
              "subjectType": "account"
            },
            {}
          ],
          [
            "traits",
            {
              "asUser": {
                "email": "roberto.hernandez@rei.com",
                "anonymous_id": "intercom-user:user-5f1afdc24c358c20a4545cdc"
              },
              "subjectType": "user"
            },
            {
              "intercom_user/email": {
                "operation": "set",
                "value": "roberto.hernandez@rei.com"
              },
              "intercom_user/id": {
                "operation": "set",
                "value": "5f1afdc24c358c20a4545cdc"
              },
              "intercom_user/phone": {
                "operation": "set",
                "value": null
              },
              "intercom_user/name": {
                "operation": "set",
                "value": "Roberto Hernandez"
              },
              "intercom_user/avatar": {
                "operation": "set",
                "value": null
              },
              "intercom_user/owner_id": {
                "operation": "set",
                "value": null
              },
              "intercom_user/has_hard_bounced": {
                "operation": "set",
                "value": false
              },
              "intercom_user/marked_email_as_spam": {
                "operation": "set",
                "value": false
              },
              "intercom_user/unsubscribed_from_emails": {
                "operation": "set",
                "value": false
              },
              "intercom_user/created_at": {
                "operation": "set",
                "value": 1593169501
              },
              "intercom_user/updated_at": {
                "operation": "set",
                "value": 1593169501
              },
              "intercom_user/segments": {
                "operation": "set",
                "value": []
              },
              "intercom_user/signed_up_at": {
                "operation": "set",
                "value": null
              },
              "intercom_user/social_profiles": {
                "operation": "set",
                "value": []
              },
              "intercom_user/last_seen_at": {
                "operation": "set",
                "value": null
              },
              "intercom_user/last_replied_at": {
                "operation": "set",
                "value": null
              },
              "intercom_user/last_contacted_at": {
                "operation": "set",
                "value": null
              },
              "intercom_user/last_email_opened_at": {
                "operation": "set",
                "value": null
              },
              "intercom_user/last_email_clicked_at": {
                "operation": "set",
                "value": null
              },
              "intercom_user/language_override": {
                "operation": "set",
                "value": null
              },
              "intercom_user/browser": {
                "operation": "set",
                "value": null
              },
              "intercom_user/browser_version": {
                "operation": "set",
                "value": null
              },
              "intercom_user/browser_language": {
                "operation": "set",
                "value": null
              },
              "intercom_user/os": {
                "operation": "set",
                "value": null
              },
              "intercom_user/location_country_name": {
                "operation": "set",
                "value": null
              },
              "intercom_user/location_region_name": {
                "operation": "set",
                "value": null
              },
              "intercom_user/location_city_name": {
                "operation": "set",
                "value": null
              },
              "intercom_user/tags": {
                "operation": "set",
                "value": []
              },
              "intercom_user/companies": {
                "operation": "set",
                "value": []
              },
              "intercom_user/duplicate_domain": {
                "operation": "set",
                "value": "rei.com"
              },
              "intercom_user/user_id": {
                "operation": "set",
                "value": null
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
            expect.objectContaining({"private_settings": expect.whatever()})
          ]
        ]
      };
    });
  });
});
