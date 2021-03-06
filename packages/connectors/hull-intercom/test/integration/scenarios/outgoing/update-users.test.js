// @flow
import connectorConfig from "../../../../server/config";
import manifest from "../../../../manifest.json";
const testScenario = require("hull-connector-framework/src/test-scenario");
const contactFields = require("../attributes/api-responses/get-contact-fields-response.json");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";

describe("Update User Tests", () => {

  it("should update a user and save user (with no additional api calls to resolve fields) back to Hull", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        connector: {
          private_settings: {
            webhook_id: "1",
            access_token: "intercomABC",
            tag_users: false,
            synchronized_user_segments: ["user_segment_1"],
            user_claims: [
              { hull: 'email', service: 'email' },
              { hull: 'external_id', service: 'external_id' }
            ],
            outgoing_user_attributes: [
              { hull: 'intercom_user/name', service: 'name' },
              { hull: 'intercom_user/description', service: 'c_description' },
              { hull: 'intercom_user/job_title', service: 'job_title' },
              { hull: 'account.description', service: 'c_description' }
            ],
            incoming_user_attributes: [
              { service: 'email', hull: 'traits_intercom_user/email', overwrite: true },
              { service: 'name', hull: 'traits_intercom_user/name', overwrite: true },
              { service: 'phone', hull: 'traits_intercom_user/phone', overwrite: true },
              { service: 'location.city', hull: 'traits_intercom_user/city',  overwrite: true }
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
            .put("/contacts/5f22f1b6fcaca714eb055739", {
              "email": "bob@rei.com",
              "name": "Bob",
              "custom_attributes": {
                "c_description": "[\"a\",\"description\",\"list\"]",
                "job_title": "sales"
              },
              "role": "user"
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
                "c_description": "[\"a\",\"description\",\"list\"]",
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
              "traits_intercom_user/tags": ["Segment 2"],
              "name": "Bob",
              "intercom_user/id": "5f22f1b6fcaca714eb055739",
              "intercom_user/name": "Bob",
              "intercom_user/description": ["a", "description", "list"],
              "intercom_user/job_title": "sales"
            },
            segments: [{ id: "user_segment_1", name: "User Segment 1" }],
            changes: {
              user: {
                "traits_intercom_user/description": [
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
          [
            "debug",
            "outgoing.user.skip",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "123",
              "user_email": "bob@rei.com"
            },
            {
              "reason": "User is not present in any of the defined segments to send to service.  Please either add a new synchronized segment which the user is present in the settings page, or add the user to an existing synchronized segment"
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
              "method": "PUT",
              "url": "/contacts/5f22f1b6fcaca714eb055739",
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
                  "c_description": "[\"a\",\"description\",\"list\"]",
                  "job_title": "sales"
                },
                "role": "user",
                "email": "bob@rei.com"
              },
              "type": "User"
            }
          ],
          [
            "debug",
            "incoming.user.success",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_email": "bob@rei.com",
              "user_external_id": "user_external_id_1",
              "user_anonymous_id": "intercom-user:user-5f22f1b6fcaca714eb055739"
            },
            {
              "data": {
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
                  "c_description": "[\"a\",\"description\",\"list\"]",
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
              "type": "User"
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
                "external_id": "user_external_id_1",
                "anonymous_id": "intercom-user:user-5f22f1b6fcaca714eb055739"
              },
              "subjectType": "user"
            },
            {
              "intercom_user/email": {
                "operation": "set",
                "value": "bob@rei.com"
              },
              "intercom_user/name": {
                "operation": "set",
                "value": "Bob"
              },
              "intercom_user/phone": {
                "operation": "set",
                "value": "a phone number"
              },
              "intercom_user/city": {
                "operation": "set",
                "value": "Atlanta"
              },
              "intercom_user/id": {
                "value": "5f22f1b6fcaca714eb055739",
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
          ["value","connector.service_api.response_time",expect.whatever()]
        ],
        platformApiCalls: []
      };
    });
  });

  it("should skip outgoing user that was deleted in intercom", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        connector: {
          private_settings: {
            webhook_id: "1",
            access_token: "intercomABC",
            tag_users: false,
            synchronized_user_segments: ["user_segment_1"],
            user_claims: [
              { hull: 'email', service: 'email' },
              { hull: 'external_id', service: 'external_id' }
            ],
            outgoing_user_attributes: [
              { hull: 'intercom_user/name', service: 'name' },
              { hull: 'intercom_user/description', service: 'c_description' },
              { hull: 'intercom_user/job_title', service: 'job_title' },
              { hull: 'account.description', service: 'c_description' }
            ],
            incoming_user_attributes: [
              { service: 'email', hull: 'traits_intercom_user/email', overwrite: true },
              { service: 'name', hull: 'traits_intercom_user/name', overwrite: true },
              { service: 'phone', hull: 'traits_intercom_user/phone', overwrite: true },
              { service: 'location.city', hull: 'traits_intercom_user/city',  overwrite: true }
            ]
          }
        },
        usersSegments: [
          { id: "s2", name: "Segment 2" }
        ],
        accountsSegments: [],
        externalApiMock: () => {},
        messages: [
          {
            account: {
              id: "1"
            },
            user: {
              id: "123",
              email: "bob@rei.com",
              "traits_intercom_user/tags": ["Segment 2"],
              "name": "Bob",
              "intercom_user/id": "5f22f1b6fcaca714eb055739",
              "intercom_user/name": "Bob",
              "intercom_user/description": "a description",
              "intercom_user/deleted_at": 1
            },
            segments: [{ id: "user_segment_1", name: "User Segment 1" }],
            changes: {
              user: {
                "traits_intercom_user/description": [
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
          [
            "debug",
            "outgoing.user.skip",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "123",
              "user_email": "bob@rei.com"
            },
            {
              "reason": "User has been deleted"
            }
          ],
          [
            "debug",
            "outgoing.user.skip",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "123",
              "user_email": "bob@rei.com"
            },
            {
              "reason": "User is not present in any of the defined segments to send to service.  Please either add a new synchronized segment which the user is present in the settings page, or add the user to an existing synchronized segment"
            }
          ],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() },
            { "jobName": "Outgoing Data", "type": "user" }
          ]
        ],
        firehoseEvents: [],
        metrics: [
          ["increment","connector.request",1]
        ],
        platformApiCalls: []
      };
    });
  });
});
