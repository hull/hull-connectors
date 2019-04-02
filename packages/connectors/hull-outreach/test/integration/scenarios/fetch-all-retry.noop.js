// @flow
const _ = require("lodash");








process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";

const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";

test("fetch all accounts and prospects from outreach with failure", () => {
  return testScenario({ connectorConfig, debounceWait: 2000 }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.scheduleHandler,
      handlerUrl: "accountFetchAll",
      connector: {
        private_settings: {
          access_token: "1234",
          link_users_in_hull: true,
          user_claims: [
              {
                  hull: "email",
                  service: "emails"
              },
              {
                  hull: "external_id",
                  service: "externalId"
              }
          ],
          incoming_user_attributes: [
            {
                "hull": "traits_outreach/custom1",
                "service": "custom1"
            },
            {
                "hull": "traits_outreach/personalNote1",
                "service": "personalNote1"
            },
          ],
          incoming_account_attributes: [
            {
                "hull": "traits_outreach/custom1",
                "service": "custom1"
            },
            {
                "hull": "traits_outreach/custom10",
                "service": "custom10"
            },
          ],
          account_claims: [
              {
                  "hull": "domain",
                  "service": "domain"
              },
              {
                  "hull": "external_id",
                  "service": "customId"
              }
          ]
        }
      },
      usersSegments: [],
      accountsSegments: [],
      externalApiMock: () => {
        const scope = nock("https://api.outreach.io");
        scope.get("/api/v2/webhooks/")
          .reply(200, {body: {data: []}});
        scope
          .post("/api/v2/webhooks/")
          .reply(201, require("../fixtures/api-responses/create-webhook.json"));
        scope
          .get("/api/v2/accounts/?sort=id&page[limit]=100&filter[id]=0..inf")
          .reply(500, {});
        scope
          .get("/api/v2/accounts/?sort=id&page[limit]=100&filter[id]=0..inf")
          .reply(200, require("../fixtures/api-responses/list-accounts.json"));
        return scope;
      },
      response: { status : "deferred"},
      logs: [
        ["info", "incoming.job.start", {}, {"jobName": "Incoming Data Request"}],
        ["debug", "connector.service_api.call", {}, {"method": "GET", "responseTime": expect.whatever(), "status": 200, "url": "/webhooks/", "vars": {}}],
        ["debug", "connector.service_api.call", {}, {"method": "POST", "responseTime": expect.whatever(), "status": 201, "url": "/webhooks/", "vars": {}}],
        ["debug", "connector.service_api.call", {}, {"method": "GET", "responseTime": expect.whatever(), "status": 500, "url": "/accounts/", "vars": {}}],
        ["debug", "connector.service_api.call", {}, {"method": "GET", "responseTime": expect.whatever(), "status": 200, "url": "/accounts/", "vars": {}}],
        ["info", "incoming.account.success", {}, {"data": {"attributes": {"outreach/custom1": {"operation": "set", "value": "some custom value"}, "outreach/custom10": {"operation": "set", "value": "another custom value"}, "outreach/id": {"operation": "set", "value": 1}}, "ident": {"anonymous_id": "outreach:1", "domain": "somehullcompany.com"}}}],
        ["info", "incoming.account.success", {}, {"data": {"attributes": {"outreach/id": {"operation": "set", "value": 4}}, "ident": {"anonymous_id": "outreach:4", "domain": "noprospectshullcompany.com"}}}],
        ["info", "incoming.job.success", {}, {"jobName": "Incoming Data Request"}]
      ],
      firehoseEvents: [
        ["traits", {"asAccount": {"anonymous_id": "outreach:1", "domain": "somehullcompany.com"}, "subjectType": "account"}, {"outreach/custom1": {"operation": "set", "value": "some custom value"}, "outreach/custom10": {"operation": "set", "value": "another custom value"}, "outreach/id": {"operation": "set", "value": 1}}],
        ["traits", {"asAccount": {"anonymous_id": "outreach:4", "domain": "noprospectshullcompany.com"}, "subjectType": "account"}, {"outreach/id": {"operation": "set", "value": 4}}]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "connector.service_api.error", 1],
        ["increment", "service.service_api.errors", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.incoming.accounts", 1],
        ["increment", "ship.incoming.accounts", 1]
      ],
      platformApiCalls: [
        ["GET", "/api/v1/app", {}, {}],
        ["GET", "/api/v1/users_segments?shipId=9993743b22d60dd829001999", {"shipId": "9993743b22d60dd829001999"}, {}],
        ["GET", "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999", {"shipId": "9993743b22d60dd829001999"}, {}],
        ["GET", "/api/v1/app", {}, {}], ["PUT", "/api/v1/9993743b22d60dd829001999", {}, {"private_settings": {"access_token": "1234", "account_claims": [{"hull": "domain", "service": "domain"}, {"hull": "external_id", "service": "customId"}], "incoming_account_attributes": [{"hull": "traits_outreach/custom1", "service": "custom1"}, {"hull": "traits_outreach/custom10", "service": "custom10"}], "incoming_user_attributes": [{"hull": "traits_outreach/custom1", "service": "custom1"}, {"hull": "traits_outreach/personalNote1", "service": "personalNote1"}], "link_users_in_hull": true, "user_claims": [{"hull": "email", "service": "emails"}, {"hull": "external_id", "service": "externalId"}], "webhook_id": 3}}]
      ]
    };
  });
});
