// @flow
import connectorConfig from "../../../server/config";

const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";

/* global describe, it, beforeEach, afterEach */
const testScenario = require("hull-connector-framework/src/test-scenario");

test("send batch user update to outreach", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    const updateMessages = {};
    return _.assign(updateMessages, {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      is_export: true,
      messages: require("../fixtures/notifier-payloads/outgoing-user-batch-multiple-payload.json"),
      connector: {
        private_settings: {
          access_token: "1234",
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
              hull: "traits_outreach/custom1",
              service: "custom1"
            },
            {
              hull: "traits_outreach/personalNote1",
              service: "personalNote1"
            }
          ],
          incoming_account_attributes: [
            {
              hull: "traits_outreach/custom1",
              service: "custom1"
            },
            {
              hull: "traits_outreach/custom10",
              service: "custom10"
            }
          ],
          account_claims: [
            {
              hull: "domain",
              service: "domain"
            },
            {
              hull: "external_id",
              service: "customId"
            }
          ]
        }
      },
      externalApiMock: () => {
        const scope = nock("https://api.outreach.io");

        scope.get("/api/v2/webhooks/").reply(200, { body: { data: [] } });
        scope
          .post("/api/v2/webhooks/")
          .reply(201, require("../fixtures/api-responses/create-webhook.json"));

        scope
          .intercept("/api/v2/prospects/16", "PATCH")
          .reply(
            200,
            require("../fixtures/api-responses/outgoing-user-darth-patch.json")
          );

        scope
          .get("/api/v2/prospects/?filter[emails]=fettisbest@gmail.com")
          .reply(200, { data: [] });
        scope
          .post("/api/v2/prospects/")
          .reply(
            200,
            require("../fixtures/api-responses/outgoing-user-darth-patch.json")
          );

        return scope;
      },
      response:  {"flow_control": {"in": 5, "in_time": 10, "size": 10, "type": "next"}},
      // most of the remaining "whatevers" are returned from the nock endpoints or are tested in traits
      logs: [
        ["info", "outgoing.job.start", expect.whatever(), {"jobName": "Outgoing Data", "type": "user"}],
        ["debug", "connector.service_api.call", expect.whatever(), {"method": "GET", "responseTime": expect.whatever(), "status": 200, "url": "/webhooks/", "vars": {}}],
        ["debug", "connector.service_api.call", expect.whatever(), {"method": "POST", "responseTime": expect.whatever(), "status": 201, "url": "/webhooks/", "vars": {}}],
        ["debug", "connector.service_api.call", expect.whatever(), {"method": "PATCH", "responseTime": expect.whatever(), "status": 200, "url": "/prospects/16", "vars": {}}],
        ["debug", "connector.service_api.call", expect.whatever(), {"method": "GET", "responseTime": expect.whatever(), "status": 200, "url": "/prospects/", "vars": {}}],
        ["info", "outgoing.user.success", {"request_id": expect.whatever(), "subject_type": "user", "user_email": "darth@darksideinc.com", "user_id": "5bd329d5e2bcf3eeaf000099"}, expect.objectContaining({"type": "Prospect"})],
        ["debug", "connector.service_api.call", expect.whatever(), {"method": "POST", "responseTime": expect.whatever(), "status": 200, "url": "/prospects/", "vars": {}}],
        ["info", "outgoing.user.success", {"request_id": expect.whatever(), "subject_type": "user", "user_email": "fettisbest@gmail.com", "user_id": expect.whatever()}, expect.objectContaining({"type": "Prospect"})],
        ["info", "incoming.user.success", expect.whatever(), {"data": {"attributes": {"outreach/id": {"operation": "set", "value": 16}, "outreach/personalNote1": {"operation": "set", "value": "sith lord, don't mention padme"}}, "ident": {"anonymous_id": "outreach:16", "email": "darth@darksideinc.com"}}}],
        ["info", "incoming.user.success", expect.whatever(), {"data": {"attributes": {"outreach/id": {"operation": "set", "value": 16}, "outreach/personalNote1": {"operation": "set", "value": "sith lord, don't mention padme"}}, "ident": {"anonymous_id": "outreach:16", "email": "darth@darksideinc.com"}}}],
        ["info", "outgoing.job.success", expect.whatever(), {"jobName": "Outgoing Data", "type": "user"}]
      ],
      // same received user because we're mocking the return of bobba with a different user
      firehoseEvents: [
        [
          "traits",
          {
            asUser: {
              anonymous_id: "outreach:16",
              email: "darth@darksideinc.com"
            },
            subjectType: "user"
          },
          {
            "outreach/id": { operation: "set", value: 16 },
            "outreach/personalNote1": {
              operation: "set",
              value: "sith lord, don't mention padme"
            }
          }
        ],
        [
          "traits",
          {
            asUser: {
              anonymous_id: "outreach:16",
              email: "darth@darksideinc.com"
            },
            subjectType: "user"
          },
          {
            "outreach/id": { operation: "set", value: 16 },
            "outreach/personalNote1": {
              operation: "set",
              value: "sith lord, don't mention padme"
            }
          }
        ]
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
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.outgoing.users", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.outgoing.users", 1],
        ["increment", "ship.incoming.users", 1],
        ["increment", "ship.incoming.users", 1]
      ],
      platformApiCalls: [
        ["GET", "/api/v1/app", {}, {}],
        [
          "PUT",
          "/api/v1/9993743b22d60dd829001999",
          {},
          {
            private_settings: {
              access_token: "1234",
              account_claims: [
                { hull: "domain", service: "domain" },
                { hull: "external_id", service: "customId" }
              ],
              incoming_account_attributes: [
                { hull: "traits_outreach/custom1", service: "custom1" },
                { hull: "traits_outreach/custom10", service: "custom10" }
              ],
              incoming_user_attributes: [
                { hull: "traits_outreach/custom1", service: "custom1" },
                {
                  hull: "traits_outreach/personalNote1",
                  service: "personalNote1"
                }
              ],
              user_claims: [
                { hull: "email", service: "emails" },
                { hull: "external_id", service: "externalId" }
              ],
              webhook_id: 3
            },
            "refresh_status": false
          }
        ]
      ]
    });
  });
});
