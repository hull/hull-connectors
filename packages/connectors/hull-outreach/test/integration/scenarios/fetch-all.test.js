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
      connector: { private_settings: { access_token: "1234" } },
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
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ method: "GET", url: "/webhooks/" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ method: "POST", url: "/webhooks/" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ method: "GET", url: "/accounts/" })],
        ["info", "incoming.account.success", expect.whatever(), expect.objectContaining({ data: { attributes: {"outreach/id":  {"operation": "set", "value": 1}}, ident: { anonymous_id: "outreach:1", domain: "somehullcompany.com" }} })],
        ["info", "incoming.account.success", expect.whatever(), expect.objectContaining({ data: { attributes: {"outreach/id":  {"operation": "set", "value": 4}}, ident: { anonymous_id: "outreach:4", domain: "noprospectshullcompany.com" }} })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ method: "GET", url: "/prospects/" })],
        ["info", "incoming.user.success", expect.whatever(), expect.objectContaining({ data: { attributes: {"outreach/id":  {"operation": "set", "value": 1}}, ident: { anonymous_id: "outreach:1", email: "ceo@somehullcompany.com" }} })],
        ["info", "incoming.user.success", expect.whatever(), expect.objectContaining({ data: { attributes: {"outreach/id":  {"operation": "set", "value": 2}}, ident: { anonymous_id: "outreach:2", email: "noAccountProspect@noaccount.com" }} })]
      ],
      firehoseEvents: [
        ["traits", expect.objectContaining({ asAccount: { anonymous_id: "outreach:1", domain: "somehullcompany.com"}, subjectType: "account"}), expect.whatever()],
        ["traits", expect.objectContaining({ asAccount: { anonymous_id: "outreach:4", domain: "noprospectshullcompany.com"}, subjectType: "account"}), expect.whatever()],
        ["traits", expect.objectContaining({ asUser: { anonymous_id: "outreach:1", email: "ceo@somehullcompany.com"}, subjectType: "user"}), expect.whatever()],
        ["traits", expect.objectContaining({ asUser: { anonymous_id: "outreach:2", email: "noAccountProspect@noaccount.com"}, subjectType: "user"}), expect.whatever()]
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
        ["GET", expect.stringContaining("/api/v1/users_segments"), expect.whatever(), {}],
        ["GET", expect.stringContaining("/api/v1/accounts_segments"), expect.whatever(), {}],
        ["GET", "/api/v1/app", {}, {}],
        ["PUT", "/api/v1/9993743b22d60dd829001999", {}, {"private_settings": {"access_token": "1234", "webhook_id": 3}}]
      ]
    };
  });
});
