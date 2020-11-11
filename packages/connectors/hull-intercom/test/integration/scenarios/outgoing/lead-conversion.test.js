// @flow
import connectorConfig from "../../../../server/config";
import manifest from "../../../../manifest.json";
const testScenario = require("hull-connector-framework/src/test-scenario");
const contactFields = require("../attributes/api-responses/get-contact-fields-response.json");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";

describe("Lead Conversion Tests", () => {

  it("should convert a lead after upserting", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        connector: {
          private_settings: {
            webhook_id: "1",
            access_token: "intercomABC",
            tag_leads: false,
            convert_leads: true,
            synchronized_lead_segments: ["lead_segment_1"],
            synchronized_user_segments: [],
            lead_claims: [
              { hull: 'email', service: 'email' }
            ],
            user_claims: [
              { hull: 'external_id', service: 'external_id' },
              { hull: 'email', service: 'email' }
            ],
            outgoing_lead_attributes: [
              { hull: 'intercom_lead/name', service: 'name' },
              { hull: 'intercom_lead/description', service: 'c_description' },
              { hull: 'intercom_lead/job_title', service: 'job_title' },
              { hull: 'account.description', service: 'c_description' }
            ],
            incoming_lead_attributes: [
              { service: 'email', hull: 'traits_intercom_lead/email', overwrite: true },
              { service: 'name', hull: 'traits_intercom_lead/name', overwrite: true },
              { service: 'phone', hull: 'traits_intercom_lead/phone', overwrite: true },
              { service: 'location.city', hull: 'traits_intercom_lead/city',  overwrite: true }
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
            .post("/contacts/search", {
              "query":  {
                "operator": "AND",
                "value": [
                  {
                    "field": "email",
                    "operator": "=",
                    "value": "bob@rei.com"
                  },
                  {
                    "field": "role",
                    "operator": "=",
                    "value": "lead"
                  }
                ]
              }
            })
            .reply(200, {
              "type": "list",
              "data": [],
              "total_count": 0,
              "pages": {
                "type": "pages",
                "page": 1,
                "per_page": 50,
                "total_pages": 0
              }
            });

          scope
            .post("/contacts", {
              "role": "lead",
              "email": "bob@rei.com",
              "name": "Bob",
              "custom_attributes": {
                "c_description": "a description",
                "job_title": "sales"
              }
            }).reply(200, {
            "type": "contact",
            "id": "5f22f1b6fcaca714eb055739",
            "workspace_id": "lkqcyt9t",
            "external_id": "lead_external_id_1",
            "role": "lead",
            "email": "bob@rei.com",
            "phone": "a phone number",
            "name": "Bob",
            "avatar": null,
            "owner_id": null,
            "social_profiles": {
              "type": "list",
              "data": []
            },
            "has_hard_bounced": false,
            "marked_email_as_spam": false,
            "unsubscribed_from_emails": false,
            "created_at": 1596125622,
            "updated_at": 1596125622,
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
              "c_description": "a description",
              "job_title": "sales"
            },
            "tags": {
              "type": "list",
              "data": [],
              "url": "/contacts/5f22f1b6fcaca714eb055739/tags",
              "total_count": 0,
              "has_more": false
            },
            "notes": {
              "type": "list",
              "data": [],
              "url": "/contacts/5f22f1b6fcaca714eb055739/notes",
              "total_count": 0,
              "has_more": false
            },
            "companies": {
              "type": "list",
              "data": [],
              "url": "/contacts/5f22f1b6fcaca714eb055739/companies",
              "total_count": 0,
              "has_more": false
            }
          });

          scope
            .get("/data_attributes?model=contact")
            .reply(200, contactFields);

          scope
            .post("/contacts/convert", {
              "contact": {
                "user_id": "lead-5f22f1b6fcaca714eb055739"
              },
              "user": {
                "user_id": "5f22f1b6fcaca714eb055739"
              }
            }).reply(200, {
            "type": "contact",
            "id": "5f22f1b6fcaca714eb055739",
            "workspace_id": "lkqcyt9t",
            "external_id": "user_external_id_1",
            "role": "user",
            "email": "bob@rei.com",
            "phone": "a phone number",
            "name": "Bob",
            "avatar": null,
            "owner_id": null,
            "social_profiles": {
              "type": "list",
              "data": []
            },
            "has_hard_bounced": false,
            "marked_email_as_spam": false,
            "unsubscribed_from_emails": false,
            "created_at": 1596125622,
            "updated_at": 1596125622,
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
              "c_description": "a description",
              "job_title": "sales",
            },
            "tags": {
              "type": "list",
              "data": [],
              "url": "/contacts/5f22f1b6fcaca714eb055739/tags",
              "total_count": 0,
              "has_more": false
            },
            "notes": {
              "type": "list",
              "data": [],
              "url": "/contacts/5f22f1b6fcaca714eb055739/notes",
              "total_count": 0,
              "has_more": false
            },
            "companies": {
              "type": "list",
              "data": [],
              "url": "/contacts/5f22f1b6fcaca714eb055739/companies",
              "total_count": 0,
              "has_more": false
            }
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
              "name": "Bob",
              "intercom_user/user_id": "5f22f1b6fcaca714eb055739",
              "intercom_lead/user_id": "lead-5f22f1b6fcaca714eb055739",
              "intercom_lead/name": "Bob",
              "intercom_lead/description": "a description",
              "intercom_lead/job_title": "sales"
            },
            segments: [{ id: "lead_segment_1", name: "Lead Segment 1" }],
            changes: {
              user: {
                "traits_intercom_lead/description": [
                  "something",
                  "a description"
                ]
              },
              segments: {
                left: [{ id: "s2", name: "Segment 2" }]
              }
            },
            events: []
          }
        ],
        response: { "flow_control": { "type": "next", } },
        logs: [
          ["info", "outgoing.job.start",
            { "request_id": expect.whatever() },
            { "jobName": "Outgoing Data", "type": "user" }
          ],
          ["debug", "outgoing.user.skip",
            {
              "request_id": expect.whatever(),
              "subject_type": "user",
              "user_email": "bob@rei.com",
              "user_id": "123",
            },
            {
              "reason": "User is not present in any of the defined segments to send to service.  Please either add a new synchronized segment which the user is present in the settings page, or add the user to an existing synchronized segment"
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
              "url": "/contacts/search",
              "status": 200,
              "vars": {}
            }
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() }, {
            "responseTime": expect.whatever(),
            "method": "GET", "url": "/data_attributes?model=contact", "status": 200, "vars": {}
          }],
          [
            "debug",
            "connector.service_api.call",
            {
              "request_id": expect.whatever()
            },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "/contacts",
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
              "user_email": "bob@rei.com"
            },
            {
              "data": {
                "name": "Bob",
                "custom_attributes": {
                  "c_description": "a description",
                  "job_title": "sales"
                },
                "role": "lead",
                "email": "bob@rei.com"
              },
              "type": "Lead"
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
              "url": "/contacts/convert",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "debug",
            "incoming.user.success",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_email": "bob@rei.com",
              "user_anonymous_id": "intercom-lead:lead-5f22f1b6fcaca714eb055739"
            },
            {
              "data": {
                "type": "contact",
                "id": "5f22f1b6fcaca714eb055739",
                "workspace_id": "lkqcyt9t",
                "external_id": "lead_external_id_1",
                "role": "lead",
                "email": "bob@rei.com",
                "phone": "a phone number",
                "name": "Bob",
                "avatar": null,
                "owner_id": null,
                "social_profiles": {
                  "type": "list",
                  "data": []
                },
                "has_hard_bounced": false,
                "marked_email_as_spam": false,
                "unsubscribed_from_emails": false,
                "created_at": 1596125622,
                "updated_at": 1596125622,
                "signed_up_at": null,
                "last_seen_at": null,
                "last_replied_at": null,
                "last_contacted_at": null,
                "last_email_opened_at": null,
                "last_email_clicked_at": null,
                "lead_converted": true,
                "language_override": null,
                "browser": null,
                "browser_version": null,
                "browser_language": null,
                "os": null,
                "location": {
                  "type": "location",
                  "country": null,
                  "region": null,
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
                  "c_description": "a description",
                  "job_title": "sales",
                },
                "tags": {
                  "type": "list",
                  "data": [],
                  "url": "/contacts/5f22f1b6fcaca714eb055739/tags",
                  "total_count": 0,
                  "has_more": false
                },
                "notes": {
                  "type": "list",
                  "data": [],
                  "url": "/contacts/5f22f1b6fcaca714eb055739/notes",
                  "total_count": 0,
                  "has_more": false
                },
                "companies": {
                  "type": "list",
                  "data": [],
                  "url": "/contacts/5f22f1b6fcaca714eb055739/companies",
                  "total_count": 0,
                  "has_more": false
                }
              },
              "type": "Lead"
            }
          ],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() },
            { "jobName": "Outgoing Data", "type": "user" }
          ]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asUser": {
                "email": "bob@rei.com",
                "anonymous_id": "intercom-lead:lead-5f22f1b6fcaca714eb055739"
              },
              "subjectType": "user"
            },
            {
              "intercom_lead/email": {
                "operation": "set",
                "value": "bob@rei.com"
              },
              "intercom_lead/name": {
                "operation": "set",
                "value": "Bob"
              },
              "intercom_lead/phone": {
                "operation": "set",
                "value": "a phone number"
              },
              "intercom_lead/city": {
                "operation": "set",
                "value": "Atlanta"
              },
              "intercom_lead/id": {
                "value": "5f22f1b6fcaca714eb055739",
                "operation": "set"
              },
              "intercom_lead/lead_converted": {
                "value": true,
                "operation": "set"
              },
              "name": {
                "operation": "setIfNull",
                "value": "Bob"
              }
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
          ["value","connector.service_api.response_time",expect.whatever()]
        ],
        platformApiCalls: []
      };
    });
  });

  it("should fail to convert a lead after upserting", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        connector: {
          private_settings: {
            webhook_id: "1",
            access_token: "intercomABC",
            tag_leads: false,
            convert_leads: true,
            synchronized_lead_segments: ["lead_segment_1"],
            synchronized_user_segments: [],
            lead_claims: [
              { hull: 'email', service: 'email' }
            ],
            user_claims: [
              { hull: 'external_id', service: 'external_id' },
              { hull: 'email', service: 'email' }
            ],
            outgoing_lead_attributes: [
              { hull: 'intercom_lead/name', service: 'name' },
              { hull: 'intercom_lead/description', service: 'c_description' },
              { hull: 'intercom_lead/job_title', service: 'job_title' },
              { hull: 'account.description', service: 'c_description' }
            ],
            incoming_lead_attributes: [
              { service: 'email', hull: 'traits_intercom_lead/email', overwrite: true },
              { service: 'name', hull: 'traits_intercom_lead/name', overwrite: true },
              { service: 'phone', hull: 'traits_intercom_lead/phone', overwrite: true },
              { service: 'location.city', hull: 'traits_intercom_lead/city',  overwrite: true }
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
            .post("/contacts/search", {
              "query":  {
                "operator": "AND",
                "value": [
                  {
                    "field": "email",
                    "operator": "=",
                    "value": "bob@rei.com"
                  },
                  {
                    "field": "role",
                    "operator": "=",
                    "value": "lead"
                  }
                ]
              }
            })
            .reply(200, {
              "type": "list",
              "data": [],
              "total_count": 0,
              "pages": {
                "type": "pages",
                "page": 1,
                "per_page": 50,
                "total_pages": 0
              }
            });

          scope
            .post("/contacts", {
              "role": "lead",
              "email": "bob@rei.com",
              "name": "Bob",
              "custom_attributes": {
                "c_description": "a description",
                "job_title": "sales"
              }
            }).reply(200, {
            "type": "contact",
            "id": "5f22f1b6fcaca714eb055739",
            "workspace_id": "lkqcyt9t",
            "external_id": "lead_external_id_1",
            "role": "lead",
            "email": "bob@rei.com",
            "phone": "a phone number",
            "name": "Bob",
            "avatar": null,
            "owner_id": null,
            "social_profiles": {
              "type": "list",
              "data": []
            },
            "has_hard_bounced": false,
            "marked_email_as_spam": false,
            "unsubscribed_from_emails": false,
            "created_at": 1596125622,
            "updated_at": 1596125622,
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
              "c_description": "a description",
              "job_title": "sales"
            },
            "tags": {
              "type": "list",
              "data": [],
              "url": "/contacts/5f22f1b6fcaca714eb055739/tags",
              "total_count": 0,
              "has_more": false
            },
            "notes": {
              "type": "list",
              "data": [],
              "url": "/contacts/5f22f1b6fcaca714eb055739/notes",
              "total_count": 0,
              "has_more": false
            },
            "companies": {
              "type": "list",
              "data": [],
              "url": "/contacts/5f22f1b6fcaca714eb055739/companies",
              "total_count": 0,
              "has_more": false
            }
          });

          scope
            .get("/data_attributes?model=contact")
            .reply(200, contactFields);

          scope
            .post("/contacts/convert", {
              "contact": {
                "user_id": "lead-5f22f1b6fcaca714eb055739"
              },
              "user": {
                "user_id": "5f22f1b6fcaca714eb055739"
              }
            }).reply(404, {
              "type": "error.list",
              "request_id": "0002hoe1pda97ft37g30",
              "errors": [
                {
                  "code": "not_found",
                  "message": "Contact Not Found"
                }
              ]
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
              "name": "Bob",
              "intercom_user/user_id": "5f22f1b6fcaca714eb055739",
              "intercom_lead/user_id": "lead-5f22f1b6fcaca714eb055739",
              "intercom_lead/name": "Bob",
              "intercom_lead/description": "a description",
              "intercom_lead/job_title": "sales"
            },
            segments: [{ id: "lead_segment_1", name: "Lead Segment 1" }],
            changes: {
              user: {
                "traits_intercom_lead/description": [
                  "something",
                  "a description"
                ]
              },
              segments: {
                left: [{ id: "s2", name: "Segment 2" }]
              }
            },
            events: []
          }
        ],
        response: { "flow_control": { "type": "next", } },
        logs: [
          ["info", "outgoing.job.start",
            { "request_id": expect.whatever() },
            { "jobName": "Outgoing Data", "type": "user" }
          ],
          ["debug", "outgoing.user.skip",
            {
              "request_id": expect.whatever(),
              "subject_type": "user",
              "user_email": "bob@rei.com",
              "user_id": "123",
            },
            {
              "reason": "User is not present in any of the defined segments to send to service.  Please either add a new synchronized segment which the user is present in the settings page, or add the user to an existing synchronized segment"
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
              "url": "/contacts/search",
              "status": 200,
              "vars": {}
            }
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() }, {
            "responseTime": expect.whatever(),
            "method": "GET", "url": "/data_attributes?model=contact", "status": 200, "vars": {}
          }],
          [
            "debug",
            "connector.service_api.call",
            {
              "request_id": expect.whatever()
            },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "/contacts",
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
              "user_email": "bob@rei.com"
            },
            {
              "data": {
                "name": "Bob",
                "custom_attributes": {
                  "c_description": "a description",
                  "job_title": "sales"
                },
                "role": "lead",
                "email": "bob@rei.com"
              },
              "type": "Lead"
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
              "url": "/contacts/convert",
              "status": 404,
              "vars": {}
            }
          ],
          [
            "debug",
            "incoming.user.success",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_email": "bob@rei.com",
              "user_anonymous_id": "intercom-lead:lead-5f22f1b6fcaca714eb055739"
            },
            {
              "data": {
                "type": "contact",
                "id": "5f22f1b6fcaca714eb055739",
                "workspace_id": "lkqcyt9t",
                "external_id": "lead_external_id_1",
                "role": "lead",
                "email": "bob@rei.com",
                "phone": "a phone number",
                "name": "Bob",
                "avatar": null,
                "owner_id": null,
                "social_profiles": {
                  "type": "list",
                  "data": []
                },
                "has_hard_bounced": false,
                "marked_email_as_spam": false,
                "unsubscribed_from_emails": false,
                "created_at": 1596125622,
                "updated_at": 1596125622,
                "signed_up_at": null,
                "last_seen_at": null,
                "last_replied_at": null,
                "last_contacted_at": null,
                "last_email_opened_at": null,
                "last_email_clicked_at": null,
                "lead_converted": true,
                "language_override": null,
                "browser": null,
                "browser_version": null,
                "browser_language": null,
                "os": null,
                "location": {
                  "type": "location",
                  "country": null,
                  "region": null,
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
                  "c_description": "a description",
                  "job_title": "sales",
                },
                "tags": {
                  "type": "list",
                  "data": [],
                  "url": "/contacts/5f22f1b6fcaca714eb055739/tags",
                  "total_count": 0,
                  "has_more": false
                },
                "notes": {
                  "type": "list",
                  "data": [],
                  "url": "/contacts/5f22f1b6fcaca714eb055739/notes",
                  "total_count": 0,
                  "has_more": false
                },
                "companies": {
                  "type": "list",
                  "data": [],
                  "url": "/contacts/5f22f1b6fcaca714eb055739/companies",
                  "total_count": 0,
                  "has_more": false
                }
              },
              "type": "Lead"
            }
          ],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() },
            { "jobName": "Outgoing Data", "type": "user" }
          ]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asUser": {
                "email": "bob@rei.com",
                "anonymous_id": "intercom-lead:lead-5f22f1b6fcaca714eb055739"
              },
              "subjectType": "user"
            },
            {
              "intercom_lead/email": {
                "operation": "set",
                "value": "bob@rei.com"
              },
              "intercom_lead/name": {
                "operation": "set",
                "value": "Bob"
              },
              "intercom_lead/phone": {
                "operation": "set",
                "value": "a phone number"
              },
              "intercom_lead/city": {
                "operation": "set",
                "value": "Atlanta"
              },
              "intercom_lead/id": {
                "value": "5f22f1b6fcaca714eb055739",
                "operation": "set"
              },
              "intercom_lead/lead_converted": {
                "value": true,
                "operation": "set"
              },
              "name": {
                "operation": "setIfNull",
                "value": "Bob"
              }
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
          ["increment","connector.service_api.error",expect.whatever()],
          ["increment","service.service_api.errors",expect.whatever()]
        ],
        platformApiCalls: []
      };
    });
  });
});
