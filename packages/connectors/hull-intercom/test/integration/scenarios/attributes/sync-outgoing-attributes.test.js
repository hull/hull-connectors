// @flow
import connectorConfig from "../../../../server/config";
import manifest from "../../../../manifest.json";

const testScenario = require("hull-connector-framework/src/test-scenario");
const contactFields = require("../attributes/api-responses/get-contact-fields-response.json");
const companyFields = require("../attributes/api-responses/get-company-fields-response.json");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";

describe("Sync Attributes Tests", () => {

  it("should sync user and lead attributes", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "ship:update",
        connector: {
          private_settings: {
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
            outgoing_account_attributes: [
              { hull: 'intercom/company_description', service: 'company description' },
              { hull: 'intercom/last_request_at', service: 'last_request_at' }
            ],
            outgoing_lead_attributes: [
              { hull: 'intercom_lead/job_title', service: 'lead job title' },
            ],
            outgoing_user_attributes: [
              { hull: 'intercom_user/name', service: 'name' },
              { hull: 'intercom_user/description', service: 'c_description' },
              { hull: 'intercom_user/job_title', service: 'user job title' },
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
            .get("/data_attributes?model=contact")
            .reply(200, contactFields);

          scope
            .post("/data_attributes", {
              "name": "user job title",
              "data_type": "string",
              "model": "contact"
            })
            .reply(200, {
              "id": 7750306,
              "type": "data_attribute",
              "name": "user job title",
              "full_name": "custom_attributes.user job title",
              "label": "user job title",
              "data_type": "string",
              "api_writable": true,
              "ui_writable": false,
              "custom": true,
              "archived": false,
              "admin_id": "3330619",
              "created_at": 1598644434,
              "updated_at": 1598644434,
              "model": "contact"
            });

          scope
            .post("/data_attributes", {
              "name": "lead job title",
              "data_type": "string",
              "model": "contact"
            })
            .reply(200, {
              "id": 7750306,
              "type": "data_attribute",
              "name": "lead job title",
              "full_name": "custom_attributes.lead job title",
              "label": "lead job title",
              "data_type": "string",
              "api_writable": true,
              "ui_writable": false,
              "custom": true,
              "archived": false,
              "admin_id": "3330619",
              "created_at": 1598644434,
              "updated_at": 1598644434,
              "model": "contact"
            });

          scope
            .get("/data_attributes?model=company")
            .reply(200, companyFields);

          scope
            .post("/data_attributes", {
              "name": "company description",
              "data_type": "string",
              "model": "company"
            })
            .reply(200, {
              "id": 7750323,
              "type": "data_attribute",
              "name": "company description",
              "full_name": "custom_attributes.company description",
              "label": "company description",
              "data_type": "string",
              "api_writable": true,
              "ui_writable": false,
              "custom": true,
              "archived": false,
              "admin_id": "3330619",
              "created_at": 1598645707,
              "updated_at": 1598645707,
              "model": "company"
            });


          return scope;
        },
        messages: [],
        response: { "flow_control": { "type": "next", } },
        logs: [
          [
            "info",
            "outgoing.job.start",
            { "request_id": expect.whatever() },
            { "jobName": "Outgoing Data", "type": "webpayload" }
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "/data_attributes?model=contact",
              "status": 200,
              "vars": {}
            }
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "/data_attributes",
              "status": 200,
              "vars": {}
            }
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "/data_attributes",
              "status": 200,
              "vars": {}
            }
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "/data_attributes?model=company",
              "status": 200,
              "vars": {}
            }
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "/data_attributes",
              "status": 200,
              "vars": {}
            }
          ],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() },
            {
              "jobName": "Outgoing Data",
              "type": "webpayload"
            }
          ]
        ],
        firehoseEvents: [],
        metrics: [
          ["increment", "connector.request", 1],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time",expect.whatever()],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time",expect.whatever()],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time",expect.whatever()],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time",expect.whatever()],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time",expect.whatever()]
        ],
        platformApiCalls: []
      };
    });
  });
});
