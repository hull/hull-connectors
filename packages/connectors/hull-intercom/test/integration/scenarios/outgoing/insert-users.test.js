// @flow
import connectorConfig from "../../../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");
const contactFields = require("../attributes/api-responses/get-contact-fields-response.json");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";
process.env.COMBINED = true;

describe("Insert User Tests", () => {

  it("should insert a user after lookup returns empty", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        is_export: true,
        connector: {
          private_settings: {
            link_users_in_service: true,
            link_users_in_hull: true,
            webhook_id: "1",
            access_token: "intercomABC",
            tag_users: true,
            synchronized_user_segments: ["user_segment_1"],
            synchronized_lead_segments: [],
            send_batch_as: "Users",
            user_claims: [
              { hull: 'email', service: 'email' },
              { hull: 'external_id', service: 'external_id' }
            ],
            outgoing_user_attributes: [
              { hull: 'intercom_user/name', service: 'name' },
              { hull: 'intercom_user/description', service: 'c_description' },
              { hull: 'intercom_user/job_title', service: 'job title' },
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
                    "field": "external_id",
                    "operator": "=",
                    "value": "user_external_id_1"
                  },
                  {
                    "field": "role",
                    "operator": "=",
                    "value": "user"
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
              "name": "Bob",
              "external_id": "user_external_id_1",
              "custom_attributes": {
                "c_description": "a description",
                "job title": "sales"
              },
              "email": "bob@rei.com",
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
              "c_description": "a description",
              "job title": "sales"
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
            .reply(200, {
              "type": "list",
              "data": [
                {
                  "id": 7063364,
                  "type": "data_attribute",
                  "name": "job title",
                  "full_name": "custom_attributes.job title",
                  "label": "job_title",
                  "data_type": "string",
                  "api_writable": true,
                  "ui_writable": true,
                  "custom": true,
                  "archived": false,
                  "created_at": 1562865949,
                  "updated_at": 1562865949,
                  "model": "contact"
                },
                {
                  "id": 7678376,
                  "type": "data_attribute",
                  "name": "c_description",
                  "full_name": "custom_attributes.c_description",
                  "label": "c_description",
                  "data_type": "string",
                  "api_writable": true,
                  "ui_writable": false,
                  "custom": true,
                  "archived": false,
                  "created_at": 1595434500,
                  "updated_at": 1595434500,
                  "model": "contact"
                }
              ]
            });

          scope
            .get("/tags")
            .reply(200, {
                "type": "list",
                "data": [
                  { "type": "tag", "id": "tag_id_2", "name": "User Segment 2" },
                  { "type": "tag", "id": "tag_id_3", "name": "User Segment 3" },
                  { "type": "tag", "id": "tag_id_4", "name": "User Segment 4" }
                ]
              }
            );

          scope
            .get("/contacts/5f22f1b6fcaca714eb055739/tags")
            .reply(200, {
                "type": "list",
                "data": [
                  { "type": "tag", "id": "tag_id_2", "name": "User Segment 2" }
                ]
              }
            );

          scope
            .post("/tags", {
              "name": "User Segment 1"
            })
            .reply(200, {
                "type": "tag",
                "id": "tag_id_1",
                "name": "User Segment 1"
              }
            );

          scope
            .post("/contacts/5f22f1b6fcaca714eb055739/tags", {
              "id": "tag_id_1"
            })
            .reply(200, {
                "type": "tag",
                "id": "tag_id_1",
                "name": "User Segment 1"
              }
            );

          scope
            .post("/contacts/5f22f1b6fcaca714eb055739/tags", {
              "id": "tag_id_3"
            })
            .reply(200, {
                "type": "tag",
                "id": "tag_id_3",
                "name": "User Segment 3"
              }
            );

          scope
            .delete("/contacts/5f22f1b6fcaca714eb055739/tags/tag_id_4")
            .reply(200, {
                "type": "tag",
                "id": "tag_id_4",
                "name": "User Segment 4"
              }
            );

          scope
            .get("/data_attributes?model=company")
            .reply(200, {
              "type": "list",
              "data": [
                {
                  "type": "data_attribute",
                  "name": "name",
                  "full_name": "name",
                  "label": "Company name",
                  "description": "The name of a company",
                  "data_type": "string",
                  "api_writable": true,
                  "ui_writable": true,
                  "custom": false,
                  "archived": false,
                  "model": "company"
                },
                {
                  "type": "data_attribute",
                  "name": "company_id",
                  "full_name": "company_id",
                  "label": "Company ID",
                  "description": "A number identifying a company",
                  "data_type": "string",
                  "api_writable": false,
                  "ui_writable": false,
                  "custom": false,
                  "archived": false,
                  "model": "company"
                },
                {
                  "type": "data_attribute",
                  "name": "monthly_spend",
                  "full_name": "monthly_spend",
                  "label": "Monthly Spend",
                  "description": "The monthly revenue you receive from a company",
                  "data_type": "float",
                  "api_writable": true,
                  "ui_writable": false,
                  "custom": false,
                  "archived": false,
                  "model": "company"
                },
                {
                  "type": "data_attribute",
                  "name": "size",
                  "full_name": "size",
                  "label": "Company size",
                  "description": "The number of people employed in this company, expressed as a single number",
                  "data_type": "integer",
                  "api_writable": true,
                  "ui_writable": true,
                  "custom": false,
                  "archived": false,
                  "model": "company"
                },
                {
                  "id": 7678696,
                  "type": "data_attribute",
                  "name": "custom_monthly_spend",
                  "full_name": "custom_attributes.custom_monthly_spend",
                  "label": "company_description",
                  "data_type": "string",
                  "api_writable": true,
                  "ui_writable": false,
                  "custom": true,
                  "archived": false,
                  "admin_id": "3330619",
                  "created_at": 1595445305,
                  "updated_at": 1595445305,
                  "model": "company"
                },
              ]
            });

          scope
            .get("/companies?company_id=account_external_id_1")
            .reply(404, {
              "type": "error.list",
              "request_id": "001kil5vake9eikife90",
              "errors": [
                {
                  "code": "company_not_found",
                  "message": "Company Not Found"
                }
              ]
            });

          scope
            .post("/companies", {
              "company_id": "account_external_id_1"
            })
            .reply(200, {
              "type": "company",
              "company_id": "account_external_id_1",
              "id": "5f4e82462bc3732be3cdf6b0",
              "app_id": "lkqcyt9t",
              "created_at": 1598980678,
              "updated_at": 1598980678,
              "monthly_spend": 0,
              "session_count": 0,
              "user_count": 0,
              "tags": {
                "type": "tag.list",
                "tags": []
              },
              "segments": {
                "type": "segment.list",
                "segments": []
              },
              "plan": {},
              "custom_attributes": {
                "creation_source": "api"
              }
            });

          scope
            .get("/companies/5f4e82462bc3732be3cdf6b0/segments")
            .reply(200, {
              "type": "list",
              "data": []
            });

          scope
            .post("/contacts/5f22f1b6fcaca714eb055739/companies", {
              "company_id": "account_external_id_1"
            }).reply(200, {
            "type": "company",
            "company_id": "account_external_id_1",
            "id": "5f4e82462bc3732be3cdf6b0",
            "app_id": "lkqcyt9t",
            "created_at": 1598980678,
            "updated_at": 1598980678,
            "monthly_spend": 0,
            "session_count": 0,
            "user_count": 0,
            "tags": {
              "type": "tag.list",
              "tags": []
            },
            "segments": {
              "type": "segment.list",
              "segments": []
            },
            "plan": {},
            "custom_attributes": {
              "creation_source": "api"
            }
          })

          return scope;
        },
        messages: [
          {
            account: {
              external_id: "account_external_id_1",
              id: "account-1"
            },
            user: {
              id: "123",
              external_id: "user_external_id_1",
              email: "bob@rei.com",
              "traits_intercom_user/tags": ["User Segment 2", "Intercom Tag 1", "Intercom Tag 2"],
              "name": "Bob",
              "intercom_user/name": "Bob",
              "intercom_user/description": "a description",
              "intercom_user/job_title": "sales"
            },
            segments: [
              { id: "user_segment_1", name: "User Segment 1" },
              { id: "user_segment_2", name: "User Segment 2" },
              { id: "user_segment_3", name: "User Segment 3  " },
              { id: "user_segment_4", name: "Intercom Tag 1" }
            ],
            changes: {
              user: {
                "traits_intercom_user/description": [
                  "something",
                  "a description"
                ]
              },
              segments: {
                entered: [
                  { id: "user_segment_1", name: "User Segment 1" },
                  { id: "user_segment_2", name: "User Segment 2" }
                ],
                left: [
                  { id: "user_segment_4", name: "User Segment 4" },
                  { id: "user_segment_5", name: "User Segment 5" }
                ]
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
              "url": "/contacts/search",
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
              "user_email": "bob@rei.com",
              "user_external_id": "user_external_id_1"
            },
            {
              "data": {
                "name": "Bob",
                "custom_attributes": {
                  "c_description": "a description",
                  "job title": "sales"
                },
                "role": "user",
                "email": "bob@rei.com",
                "external_id": "user_external_id_1"
              },
              "type": "User"
            }
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "/tags",
              "status": 200,
              "vars": {}
            }
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "/contacts/5f22f1b6fcaca714eb055739/tags",
              "status": 200,
              "vars": {}
            }
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "/tags",
              "status": 200,
              "vars": {}
            }
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "/contacts/5f22f1b6fcaca714eb055739/tags",
              "status": 200,
              "vars": {}
            }
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "/contacts/5f22f1b6fcaca714eb055739/tags",
              "status": 200,
              "vars": {}
            }
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "DELETE",
              "url": "/contacts/5f22f1b6fcaca714eb055739/tags/tag_id_4",
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
              "user_anonymous_id": "intercom-user:user-5f22f1b6fcaca714eb055739",
              "user_external_id": "user_external_id_1"
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
                  "c_description": "a description",
                  "job title": "sales",
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
          [
            "debug",
            "connector.service_api.call",
            {
              "request_id": expect.whatever()
            },
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "/data_attributes?model=company",
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
              "method": "GET",
              "url": "/companies",
              "status": 404,
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
              "url": "/companies",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "info",
            "outgoing.account.success",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_id": "account-1",
              "account_external_id": "account_external_id_1"
            },
            {
              "data": {
                "company_id": "account_external_id_1"
              },
              "type": "Company"
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
              "url": "/companies/5f4e82462bc3732be3cdf6b0/segments",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "debug",
            "incoming.account.success",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_external_id": "account_external_id_1",
              "account_anonymous_id": "intercom:5f4e82462bc3732be3cdf6b0"
            },
            {
              "data": {
                "type": "company",
                "company_id": "account_external_id_1",
                "id": "5f4e82462bc3732be3cdf6b0",
                "app_id": "lkqcyt9t",
                "created_at": 1598980678,
                "updated_at": 1598980678,
                "monthly_spend": 0,
                "session_count": 0,
                "user_count": 0,
                "tags": {
                  "type": "tag.list",
                  "tags": []
                },
                "segments": {
                  "type": "segment.list",
                  "segments": []
                },
                "plan": {},
                "custom_attributes": {
                  "creation_source": "api"
                }
              },
              "type": "Company"
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
              "url": "/contacts/5f22f1b6fcaca714eb055739/companies",
              "status": 200,
              "vars": {}
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
                "anonymous_id": "intercom-user:user-5f22f1b6fcaca714eb055739",
                "external_id": "user_external_id_1",
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
          ],
          [
            "traits",
            {
              "asAccount": {
                "anonymous_id": "intercom:5f4e82462bc3732be3cdf6b0",
                "external_id": "account_external_id_1"
              },
              "subjectType": "account",
            },
            {
              "intercom/company_id": {
                "operation": "set",
                "value": "account_external_id_1"
              },
              "intercom/id": {
                "operation": "set",
                "value": "5f4e82462bc3732be3cdf6b0"
              },
              "intercom/segments": {
                "operation": "set",
                "value": []
              },
              "intercom/tags": {
                "operation": "set",
                "value": []
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
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","connector.service_api.error",1],
          ["increment","service.service_api.errors",1],
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
});
