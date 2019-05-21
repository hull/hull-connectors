// @flow
/* global describe, it, beforeEach, afterEach */
import connectorConfig from "../../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";

process.env.OVERRIDE_HUBSPOT_URL = "";

it("send batch account update to hubspot in a batch", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    // const updateMessage = require("../fixtures/outgoin-account-batch");
    return {
      handlerType: handlers.batchHandler,
      handlerUrl: "batch-accounts",
      channel: "account:update",
      messages: [
        require("../fixtures/notifier-payloads/outgoing-account-batch-payload-hubspot.json")
      ],
      usersSegments: [],
      accountsSegments: [],
      connector: {
        private_settings: {
          outgoing_account_attributes: [
            {
              hull: "name",
              service: "about_us"
            },
            {
              hull: "closeio/industry_sample",
              service: "industry"
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
          link_users_in_hull: false
        }
      },
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");

        scope.get("/contacts/v2/groups?includeProperties=true").reply(200, []);
        scope
          .get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, []);

        const updatedCompany = [
          {
            properties: [
              { name: "about_us", value: "Wayne Enterprises (Sample Lead)" },
              { name: "industry", value: "Manufacturing" },
              { name: "hull_segments", value: "Bad guys" },
              { name: "domain", value: "wayneenterprises.com" }
            ],
            objectId: "1778846597"
          }
        ];
        scope
          .post("/companies/v1/batch-async/update?auditId=Hull")
          .reply(202, updatedCompany);

        return scope;
      },
      response: {},
      // most of the remaining "whatevers" are returned from the nock endpoints or are tested in traits
      logs: [
        [
          "debug",
          "connector.service_api.call",
          {},
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
          {},
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
          {},
          { toInsert: 0, toSkip: 0, toUpdate: 1 }
        ],
        [
          "debug",
          "connector.service_api.call",
          {},
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
            account_id: /* "5bf2e7bf064aee16a600092a"*/ expect.whatever(),
            subject_type: "account"
          },
          {
            hubspotWriteCompany: {
              objectId: "1778846597",
              properties: [
                { name: "about_us", value: "Wayne Enterprises (Sample Lead)" },
                { name: "hull_segments", value: "" },
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
      platformApiCalls: [
        ["GET", "/_accounts_batch", {}, {}],
        ["GET", "/api/v1/search/user_reports/bootstrap", {}, {}],
        ["GET", "/api/v1/search/account_reports/bootstrap", {}, {}]
      ]
    };
  });
});
