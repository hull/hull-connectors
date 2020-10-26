// @flow
import connectorConfig from "../../../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");
const contactFields = require("./api-responses/get-contact-fields-response.json");
const companyFields = require("./api-responses/get-company-fields-response.json");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";

describe("Fetch Intercom Attributes Tests", () => {

  it("should fetch api_writable contact attributes and build outgoing attribute mapper options", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.jsonHandler,
        handlerUrl: "schema/contact_fields_writable",
        connector: {
          private_settings: {
            webhook_id: "1",
            access_token: "12345"
          }
        },
        usersSegments: [],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://api.intercom.io");

          scope
            .get("/data_attributes?model=contact")
            .reply(200, contactFields);

          return scope;
        },
        response: {
          "options": [
            {
              "label": "Contact role",
              "value": "role"
            },
            {
              "label": "Name",
              "value": "name"
            },
            {
              "label": "Owner",
              "value": "owner_id"
            },
            {
              "label": "Email",
              "value": "email"
            },
            {
              "label": "Phone",
              "value": "phone"
            },
            {
              "label": "User ID",
              "value": "external_id"
            },
            {
              "label": "Signed up",
              "value": "signed_up_at"
            },
            {
              "label": "Last seen",
              "value": "last_seen_at"
            },
            {
              "label": "Unsubscribed from Emails",
              "value": "unsubscribed_from_emails"
            },
            {
              "label": "job_title",
              "value": "job_title"
            },
            {
              "label": "customerDepartment",
              "value": "customerDepartment"
            },
            {
              "label": "c_domain",
              "value": "c_domain"
            },
            {
              "label": "c_description",
              "value": "c_description"
            },
            {
              "label": "MyCustomDescription",
              "value": "MyCustomDescription"
            },
            {
              "label": "Avatar image url",
              "value": "avatar"
            }
          ]
        },
        logs: [
          ["info", "incoming.job.start", {}, { "jobName": "Incoming Data", "type": "webpayload" }],
          ["debug", "connector.service_api.call", {}, {
            "responseTime": expect.whatever(),
            "method": "GET", "url": "/data_attributes?model=contact", "status": 200, "vars": {}
          }],
          ["info", "incoming.job.success", {}, { "jobName": "Incoming Data", "type": "webpayload" }]
        ],
        firehoseEvents: [],
        metrics: [
          ["increment", "connector.request", 1],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time",expect.whatever()]
        ],
        platformApiCalls: [
          ["GET", "/api/v1/app", {}, {}],
          ["GET", "/api/v1/users_segments?shipId=9993743b22d60dd829001999", { "shipId": "9993743b22d60dd829001999" }, {}],
          ["GET", "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999", { "shipId": "9993743b22d60dd829001999" }, {}]
        ]
      };
    });
  });

  it("should fetch all contact attributes and build incoming attribute mapper options", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.jsonHandler,
        handlerUrl: "schema/contact_fields",
        connector: {
          private_settings: {
            webhook_id: "1",
            access_token: "12345"
          }
        },
        usersSegments: [],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://api.intercom.io");

          scope
            .get("/data_attributes?model=contact")
            .reply(200, contactFields);

          return scope;
        },
        response: { "options": [
          {
            "label": "Companies",
            "value": "companies"
          },
          {
            "label": "Tags",
            "value": "tags"
          },
          {
            "label": "Social Profiles",
            "value": "social_profiles"
          },
          {
            "label": "Contact role",
            "value": "role"
          },
          {
            "label": "Name",
            "value": "name"
          },
          {
            "label": "Owner",
            "value": "owner_id"
          },
          {
            "label": "Email",
            "value": "email"
          },
          {
            "label": "Phone",
            "value": "phone"
          },
          {
            "label": "User ID",
            "value": "external_id"
          },
          {
            "label": "First Seen",
            "value": "created_at"
          },
          {
            "label": "Signed up",
            "value": "signed_up_at"
          },
          {
            "label": "Last seen",
            "value": "last_seen_at"
          },
          {
            "label": "Last contacted",
            "value": "last_contacted_at"
          },
          {
            "label": "Last heard from",
            "value": "last_replied_at"
          },
          {
            "label": "Last opened email",
            "value": "last_email_opened_at"
          },
          {
            "label": "Last clicked on link in email",
            "value": "last_email_clicked_at"
          },
          {
            "label": "Country",
            "value": "location.country"
          },
          {
            "label": "Region",
            "value": "location.region"
          },
          {
            "label": "City",
            "value": "location.city"
          },
          {
            "label": "Browser Language",
            "value": "browser_language"
          },
          {
            "label": "Language Override",
            "value": "language_override"
          },
          {
            "label": "Browser",
            "value": "browser"
          },
          {
            "label": "Browser Version",
            "value": "browser_version"
          },
          {
            "label": "OS",
            "value": "os"
          },
          {
            "label": "Unsubscribed from Emails",
            "value": "unsubscribed_from_emails"
          },
          {
            "label": "Marked email as spam",
            "value": "marked_email_as_spam"
          },
          {
            "label": "Has hard bounced",
            "value": "has_hard_bounced"
          },
          {
            "label": "job_title",
            "value": "custom_attributes.job_title"
          },
          {
            "label": "customerDepartment",
            "value": "custom_attributes.customerDepartment"
          },
          {
            "label": "c_domain",
            "value": "custom_attributes.c_domain"
          },
            {
            "label": "c_description",
            "value": "custom_attributes.c_description"
          },
          {
            "label": "MyCustomDescription",
            "value": "custom_attributes.MyCustomDescription"
          },
          {
            "label": "ID",
            "value": "id"
          },
          {
            "label": "Avatar image url",
            "value": "avatar"
          },
          {
            "label": "Updated at",
            "value": "updated_at"
          },
          {
            "label": "Workspace ID",
            "value": "workspace_id"
          },
          {
            "label": "Android App name",
            "value": "android_app_name"
          },
          {
            "label": "Android SDK version",
            "value": "android_sdk_version"
          },
          {
            "label": "iOS App name",
            "value": "ios_app_name"
          },
          {
            "label": "iOS SDK version",
            "value": "ios_sdk_version"
          }
        ]},
        logs: [
          ["info", "incoming.job.start", {}, { "jobName": "Incoming Data", "type": "webpayload" }],
          ["debug", "connector.service_api.call", {}, {
            "responseTime": expect.whatever(),
            "method": "GET", "url": "/data_attributes?model=contact", "status": 200, "vars": {}
          }],
          ["info", "incoming.job.success", {}, { "jobName": "Incoming Data", "type": "webpayload" }]
        ],
        firehoseEvents: [],
        metrics: [
          ["increment", "connector.request", 1],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time",expect.whatever()]
        ],
        platformApiCalls: [
          ["GET", "/api/v1/app", {}, {}],
          ["GET", "/api/v1/users_segments?shipId=9993743b22d60dd829001999", { "shipId": "9993743b22d60dd829001999" }, {}],
          ["GET", "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999", { "shipId": "9993743b22d60dd829001999" }, {}]
        ]
      };
    });
  });

  it("should fetch all company attributes and build incoming attribute mapper options", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.jsonHandler,
        handlerUrl: "schema/company_fields",
        connector: {
          private_settings: {
            webhook_id: "1",
            access_token: "12345"
          }
        },
        usersSegments: [],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://api.intercom.io");

          scope
            .get("/data_attributes?model=company")
            .reply(200, companyFields);

          return scope;
        },
        response: {
          "options": [
            {
              "label": "Tags",
              "value": "tags"
            },
            {
              "label": "Company name",
              "value": "name"
            },
            {
              "label": "Company ID",
              "value": "company_id"
            },
            {
              "label": "Company last seen",
              "value": "last_request_at"
            },
            {
              "label": "Company created at",
              "value": "remote_created_at"
            },
            {
              "label": "People",
              "value": "user_count"
            },
            {
              "label": "Company web sessions",
              "value": "session_count"
            },
            {
              "label": "Plan",
              "value": "plan.name"
            },
            {
              "label": "Monthly Spend",
              "value": "monthly_spend"
            },
            {
              "label": "Company size",
              "value": "size"
            },
            {
              "label": "Company industry",
              "value": "industry"
            },
            {
              "label": "Company website",
              "value": "website"
            },
            {
              "label": "creation_source",
              "value": "custom_attributes.creation_source"
            },
            {
              "label": "company_description",
              "value": "custom_attributes.company_description"
            },
            {
              "label": "CompanyPlanType",
              "value": "custom_attributes.CompanyPlanType"
            },
            {
              "label": "ID",
              "value": "id"
            },
            {
              "label": "Created at",
              "value": "created_at"
            },
            {
              "label": "Updated at",
              "value": "updated_at"
            },
            {
              "label": "Plan ID",
              "value": "plan.id"
            },
            {
              "label": "App ID",
              "value": "app_id"
            }
          ]
        },
        logs: [
          ["info", "incoming.job.start", {}, { "jobName": "Incoming Data", "type": "webpayload" }],
          ["debug", "connector.service_api.call", {}, {
            "responseTime": expect.whatever(),
            "method": "GET", "url": "/data_attributes?model=company", "status": 200, "vars": {}
          }],
          ["info", "incoming.job.success", {}, { "jobName": "Incoming Data", "type": "webpayload" }]
        ],
        firehoseEvents: [],
        metrics: [
          ["increment", "connector.request", 1],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time",expect.whatever()]
        ],
        platformApiCalls: [
          ["GET", "/api/v1/app", {}, {}],
          ["GET", "/api/v1/users_segments?shipId=9993743b22d60dd829001999", { "shipId": "9993743b22d60dd829001999" }, {}],
          ["GET", "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999", { "shipId": "9993743b22d60dd829001999" }, {}]
        ]
      };
    });
  });
});
