// @flow
const _ = require("lodash");

/* global describe, it, beforeEach, afterEach */

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";

const testScenario = require("hull-connector-framework/src/test-scenario");
const connectorServer = require("../../../server/server");

test("process account update webhook from outreach", () => {
  return testScenario({ connectorServer }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.incomingRequestHandler,
      externalIncomingRequest: ({ superagent, connectorUrl, plainCredentials }) => {
        console.log(plainCredentials);
        return superagent
          .post(`${connectorUrl}/webhooks?ship=${plainCredentials.ship}&organization=${plainCredentials.organization}&secret=1234`)
          .send(require("../fixtures/webhook-payloads/account-updated.json"));
      },
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
            {
                "hull": "traits_outreach/name",
                "service": "name"
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
      externalApiMock: () => {
        const scope = nock("https://api.outreach.io");
        scope.get("/api/v2/webhooks/")
          .reply(200, {data: []});
        scope
          .post("/api/v2/webhooks/")
          .reply(201, require("../fixtures/api-responses/create-webhook.json"));
        return scope;
      },
      usersSegments: [],
      accountsSegments: [],
      response: {},
      logs: [
          ["debug", "connector.service_api.call", {}, {"method": "GET", "responseTime": expect.whatever(), "status": 200, "url": "/webhooks/", "vars": {}}],
          ["debug", "connector.service_api.call", {}, {"method": "POST", "responseTime": expect.whatever(), "status": 201, "url": "/webhooks/", "vars": {}}],
          ["info", "incoming.account.success", {}, {"data": {"attributes": {"outreach/custom1": {"operation": "set", "value": "it's a hull company, but we don't know too much more"}, "outreach/id": {"operation": "set", "value": 1}}, "ident": {"anonymous_id": "outreach:1"}}}]
      ],
      firehoseEvents: [
        ["traits", {"asAccount": {"anonymous_id": "outreach:1"}, "subjectType": "account"}, {"outreach/custom1": {"operation": "set", "value": "it's a hull company, but we don't know too much more"}, "outreach/id": {"operation": "set", "value": 1}}]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.incoming.accounts", 1]
      ],
      platformApiCalls: [
        ["GET", "/api/v1/app", {}, {}],
        ["GET", "/api/v1/users_segments?shipId=9993743b22d60dd829001999", {"shipId": "9993743b22d60dd829001999"}, {}],
        ["GET", "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999", {"shipId": "9993743b22d60dd829001999"}, {}],
        ["GET", "/api/v1/app", {}, {}],
        ["PUT", "/api/v1/9993743b22d60dd829001999", {}, {"private_settings": {"access_token": "1234", "account_claims": [{"hull": "domain", "service": "domain"}, {"hull": "external_id", "service": "customId"}], "incoming_account_attributes": [{"hull": "traits_outreach/custom1", "service": "custom1"}, {"hull": "traits_outreach/custom10", "service": "custom10"}, {"hull": "traits_outreach/name", "service": "name"}], "incoming_user_attributes": [{"hull": "traits_outreach/custom1", "service": "custom1"}, {"hull": "traits_outreach/personalNote1", "service": "personalNote1"}], "link_users_in_hull": true, "user_claims": [{"hull": "email", "service": "emails"}, {"hull": "external_id", "service": "externalId"}], "webhook_id": 3}}]
      ]
    };
  });
});
