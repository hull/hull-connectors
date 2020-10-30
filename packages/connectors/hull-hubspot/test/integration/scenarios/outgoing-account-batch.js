// @flow
/* global describe, it, beforeEach, afterEach */
import connectorConfig from "../../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");
const companyPropertyGroups = require("../fixtures/get-properties-companies-groups");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";
process.env.OVERRIDE_HUBSPOT_URL = "";

it("send batch account update to hubspot in a batch", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "account:update",
      is_export: true,
      messages: require("../fixtures/notifier-payloads/outgoing-account-batch-payload-hubspot.json"),
      usersSegments: [],
      accountsSegments: [],
      connector: {
        private_settings: {
          outgoing_account_attributes: [
            { hull: "name", service: "about_us" },
            { hull: "closeio/industry_sample", service: "industry" },
            {
              hull: "account_segments.name[]",
              service: "hull_segments",
              overwrite: true
            }
          ],
          handle_accounts: true,
          refresh_token: "refreshtoken",
          token_fetched_at: "1554212884333",
          is_fetch_completed: false,
          synchronized_user_segments: ["5bd720690026ca86b000004f"],
          incoming_account_claims: [
            {
              hull: "domain",
              service: "properties.domain.value",
              required: true
            }
          ],
          last_fetch_at: "2019-04-02T16:27:21+02:00",
          token: "shhh",
          companies_last_fetch_at: "2019-04-02T16:27:16+02:00",
          link_users_in_service: false,
          expires_in: 21600,
          portal_id: 5088166,
          synchronized_account_segments: ["5bd7201aa682bc4a4d00001e"],
          link_users_in_hull: false,
          mark_deleted_contacts: false,
          mark_deleted_companies: false
        }
      },
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");

        scope.get("/contacts/v2/groups?includeProperties=true").reply(200, []);
        scope
          .get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, companyPropertyGroups);

        scope
          .post("/companies/v1/batch-async/update?auditId=Hull", [
            {
              properties: [
                { name: "about_us", value: "Wayne Enterprises (Sample Lead)" },
                { name: "industry", value: "Manufacturing" },
                { name: "domain", value: "wayneenterprises.com" }
              ],
              objectId: "1778846597"
            }
          ])
          .reply(202);
        return scope;
      },
      response: {
        flow_control: {
          type: "next"
        }
      },
      logs: [
        [
          "debug",
          "connector.service_api.call",
          {
            request_id: expect.whatever()
          },
          {
            method: "GET",
            responseTime: expect.whatever(),
            status: 200,
            url: "/contacts/v2/groups",
            vars: {}
          }
        ],
        [
          "debug",
          "connector.service_api.call",
          {
            request_id: expect.whatever()
          },
          {
            method: "GET",
            responseTime: expect.whatever(),
            status: 200,
            url: "/properties/v1/companies/groups",
            vars: {}
          }
        ],
        [
          "debug",
          "outgoing.job.start",
          {
            request_id: expect.whatever()
          },
          { toInsert: 0, toSkip: 0, toUpdate: 1 }
        ],
        [
          "debug",
          "connector.service_api.call",
          {
            request_id: expect.whatever()
          },
          {
            method: "POST",
            responseTime: expect.whatever(),
            status: 202,
            url: "/companies/v1/batch-async/update",
            vars: {}
          }
        ],
        [
          "info",
          "outgoing.account.success",
          {
            account_domain: "wayneenterprises.com",
            account_id: expect.whatever(),
            request_id: expect.whatever(),
            subject_type: "account"
          },
          {
            hubspotWriteCompany: {
              objectId: "1778846597",
              properties: [
                { name: "about_us", value: "Wayne Enterprises (Sample Lead)" },
                { name: "industry", value: "Manufacturing" },
                { name: "domain", value: "wayneenterprises.com" }
              ]
            },
            operation: "update"
          }
        ]
      ],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()]
      ],
      platformApiCalls: []
    };
  });
});
