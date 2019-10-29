// @flow
const _ = require("lodash");









process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";

const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";

test("receive incoming webhook for prospect creation from outreach", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.incomingRequestHandler,
      externalIncomingRequest: ({ superagent, connectorUrl, plainCredentials }) => {
        return superagent
          .post(`${connectorUrl}/webhooks?ship=${plainCredentials.ship}&organization=${plainCredentials.organization}&secret=1234`)
          .send(require("../fixtures/webhook-payloads/prospect-created.json"));
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
            {
                "hull": "traits_outreach/title",
                "service": "title"
            },
            {
              "hull": "traits_outreach/owner",
              "service": "owner"
            },
            {
              "hull": "traits_outreach/someSdrsEmail",
              "service": "ownerEmail"
            },
            {
              "hull": "traits_outreach/someStage",
              "service": "stage"
            },
            {
              "hull": "traits_outreach/someStageName",
              "service": "stageName"
            }
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
        scope
          .get("/api/v2/users/")
          .reply(201, { data: [ { id: 1, attributes: { email: "andy@hull.io" } }, { id: 0, attributes: { email: "tim@hull.io" }}]});
        scope
          .get("/api/v2/stages/")
          .reply(201, { data: [ { id: 1, attributes: { name: "New Stage" } }, { id: 0, attributes: { name: "Cool Stage" }}]});
        return scope;
      },
      usersSegments: [],
      accountsSegments: [],
      response: {},
      logs: [
        ["info", "incoming.job.start", {}, { "jobName": "Incoming Data", "type": "webpayload" } ],
        ["debug", "connector.service_api.call", {}, {"method": "GET", "responseTime": expect.whatever(), "status": 200, "url": "/webhooks/", "vars": {}}],
        ["debug", "connector.service_api.call", {}, {"method": "POST", "responseTime": expect.whatever(), "status": 201, "url": "/webhooks/", "vars": {}}],
        ["debug", "connector.service_api.call", {}, {"method": "GET", "responseTime": expect.whatever(), "status": 201, "url": "/users/", "vars": {}}],
        ["debug", "connector.service_api.call", {}, {"method": "GET", "responseTime": expect.whatever(), "status": 201, "url": "/stages/", "vars": {}}],
        ["info", "incoming.user.success", {
          "subject_type": "user",
          "user_anonymous_id": "outreach:3"
        }, {"data": expect.whatever(), "type": "WebPayload" }],
        ["info", "incoming.job.success", {}, { "jobName": "Incoming Data", "type": "webpayload" } ]
      ],
      firehoseEvents: [
        ["traits", {"asUser": {"anonymous_id": "outreach:3"}, "subjectType": "user"}, {"outreach/created_by_webhook": {"operation": "set", "value": true}, "outreach/id": {"operation": "set", "value": 3}, "outreach/title": {"operation": "set", "value": "Jedi Knight"}}],
        ["traits", {"asAccount": {"anonymous_id": "outreach:5"}, "asUser": {"anonymous_id": "outreach:3"}, "subjectType": "account"}, {}]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()]
      ],
      platformApiCalls: [
        ["GET", "/api/v1/app", {}, {}],
        ["GET", "/api/v1/users_segments?shipId=9993743b22d60dd829001999", {"shipId": "9993743b22d60dd829001999"}, {}],
        ["GET", "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999", {"shipId": "9993743b22d60dd829001999"}, {}],
        ["GET", "/api/v1/app", {}, {}],
        ["PUT", "/api/v1/9993743b22d60dd829001999", {}, {"private_settings": {"access_token": "1234", "account_claims": [{"hull": "domain", "service": "domain"}, {"hull": "external_id", "service": "customId"}], "incoming_account_attributes": [{"hull": "traits_outreach/custom1", "service": "custom1"}, {"hull": "traits_outreach/custom10", "service": "custom10"}, {"hull": "traits_outreach/name", "service": "name"}], "incoming_user_attributes": [{"hull": "traits_outreach/custom1", "service": "custom1"}, {"hull": "traits_outreach/personalNote1", "service": "personalNote1"}, {"hull": "traits_outreach/title", "service": "title"}, {"hull": "traits_outreach/owner", "service": "owner"}], "link_users_in_hull": true, "user_claims": [{"hull": "email", "service": "emails"}, {"hull": "external_id", "service": "externalId"}], "webhook_id": 3}, "refresh_status": false}]
      ]
    };
  });
});
