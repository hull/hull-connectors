// @flow
const _ = require("lodash");

/* global describe, it, beforeEach, afterEach */

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";

const testScenario = require("hull-connector-framework/src/test-scenario");
const connectorServer = require("../../../server/server");

test("fetch all accounts and prospects from outreach", () => {
  return testScenario({ connectorServer }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.scheduleHandler,
      handlerUrl: "fetch",
      connector: {
        private_settings: {
          access_token: "1234",
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
          .get("/api/v2/accounts/")
          .reply(200, require("../fixtures/api-responses/list-accounts.json"));
        scope
          .get("/api/v2/prospects/")
          .reply(200, require("../fixtures/api-responses/list-prospects.json"));
        return scope;
      },
      response: { response : "ok"},
      logs: [
        ["debug", "connector.service_api.call", {}, {"method": "GET", "responseTime": expect.whatever(), "status": 200, "url": "/webhooks/", "vars": {}}],
        ["debug", "connector.service_api.call", {}, {"method": "POST", "responseTime": expect.whatever(), "status": 201, "url": "/webhooks/", "vars": {}}],
        ["debug", "connector.service_api.call", {}, {"method": "GET", "responseTime": expect.whatever(), "status": 200, "url": "/accounts/", "vars": {}}],
        ["info", "incoming.account.success", {}, {"data": {"attributes": {"outreach/custom1": {"operation": "set", "value": "some custom value"}, "outreach/custom10": {"operation": "set", "value": "another custom value"}, "outreach/id": {"operation": "set", "value": 1}}, "ident": {"anonymous_id": "outreach:1", "domain": "somehullcompany.com"}}}],
        ["info", "incoming.account.success", {}, {"data": {"attributes": {"outreach/id": {"operation": "set", "value": 4}}, "ident": {"anonymous_id": "outreach:4", "domain": "noprospectshullcompany.com"}}}],
        ["debug", "connector.service_api.call", {}, {"method": "GET", "responseTime": expect.whatever(), "status": 200, "url": "/prospects/", "vars": {}}],
        ["info", "incoming.user.success", {}, {"data": {"accountIdent": { "anonymous_id": "outreach:1" }, "attributes": {"outreach/custom1": {"operation": "set", "value": "He's cool"}, "outreach/id": {"operation": "set", "value": 1}, "outreach/personalNote1": {"operation": "set", "value": "he's a cool guy I guess...."}}, "ident": {"anonymous_id": "outreach:1", "email": "ceo@somehullcompany.com"}}}],
        ["info", "incoming.user.success", {}, {"data": {"accountIdent": { "anonymous_id": "outreach:3" }, "attributes": {"outreach/id": {"operation": "set", "value": 2}}, "ident": {"anonymous_id": "outreach:2", "email": "noAccountProspect@noaccount.com"}}}]
      ],
      firehoseEvents: [
        ["traits", {"asAccount": {"anonymous_id": "outreach:1", "domain": "somehullcompany.com"}, "subjectType": "account"}, {"outreach/custom1": {"operation": "set", "value": "some custom value"}, "outreach/custom10": {"operation": "set", "value": "another custom value"}, "outreach/id": {"operation": "set", "value": 1}}],
        ["traits", {"asAccount": {"anonymous_id": "outreach:4", "domain": "noprospectshullcompany.com"}, "subjectType": "account"}, {"outreach/id": {"operation": "set", "value": 4}}],
        ["traits", {"asUser": {"anonymous_id": "outreach:1", "email": "ceo@somehullcompany.com"}, "subjectType": "user"}, {"outreach/custom1": {"operation": "set", "value": "He's cool"}, "outreach/id": {"operation": "set", "value": 1}, "outreach/personalNote1": {"operation": "set", "value": "he's a cool guy I guess...."}}],
        ["traits", {"asUser": {"anonymous_id": "outreach:2", "email": "noAccountProspect@noaccount.com"}, "subjectType": "user"}, {"outreach/id": {"operation": "set", "value": 2}}],
        ["traits", {"asAccount": {"anonymous_id": "outreach:1"}, "asUser": {"anonymous_id": "outreach:1", "email": "ceo@somehullcompany.com"}, "subjectType": "account"}, {}],
        ["traits", {"asAccount": {"anonymous_id": "outreach:3"}, "asUser": {"anonymous_id": "outreach:2", "email": "noAccountProspect@noaccount.com"}, "subjectType": "account"}, {}]
      ],
      metrics: [
        ["increment", "connector.request", 1],

        // Ensure webhooks
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],

        // Get Accounts
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],

        ["increment", "ship.incoming.users", 1],
        ["increment", "ship.incoming.users", 1],

        // Get Users
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],

        ["increment", "ship.incoming.accounts", 1],
        ["increment", "ship.incoming.accounts", 1],
      ],
      platformApiCalls: [
        ["GET", "/api/v1/app", {}, {}],
        ["GET", "/api/v1/users_segments?shipId=9993743b22d60dd829001999", {"shipId": "9993743b22d60dd829001999"}, {}],
        ["GET", "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999", {"shipId": "9993743b22d60dd829001999"}, {}],
        ["GET", "/api/v1/app", {}, {}],
        ["PUT", "/api/v1/9993743b22d60dd829001999", {}, {"private_settings": {"access_token": "1234", "incoming_account_attributes": [{"hull": "traits_outreach/custom1", "service": "custom1"}, {"hull": "traits_outreach/custom10", "service": "custom10"}], "incoming_user_attributes": [{"hull": "traits_outreach/custom1", "service": "custom1"}, {"hull": "traits_outreach/personalNote1", "service": "personalNote1"}], "webhook_id": 3}}]
      ]
    };
  });
});
