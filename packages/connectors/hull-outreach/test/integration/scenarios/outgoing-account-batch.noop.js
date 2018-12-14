// @flow
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";

/* global describe, it, beforeEach, afterEach */
const testScenario = require("hull-connector-framework/src/test-scenario");
const connectorServer = require("../../../server/server");


test("send batch user update to outreach", () => {
  return testScenario({ connectorServer }, ({ handlers, nock, expect }) => {
    const updateMessages = require("../fixtures/notifier-payloads/outgoing-account-batch.json");
    return _.assign(updateMessages, {
      handlerType: handlers.batchHandler,
      handlerUrl: "batch-accounts",
      channel: "account:update",
      messages: [require("../fixtures/notifier-payloads/outgoing-account-batch-payload.json")],
      connector: {
        private_settings: {
          access_token: "1234",
          outgoing_account_attributes: [
            {
                "hull": "name",
                "service": "name"
            },
            {
                "hull": "traits_closeio/description",
                "service": "custom1"
            },
            {
                "hull": "traits_closeio/industry_sample",
                "service": "custom2"
            },
            {
                "hull": "traits_closeio/status",
                "service": "custom3"
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
          .reply(200, {body: {data: []}});
        scope
          .post("/api/v2/webhooks/")
          .reply(201, require("../fixtures/api-responses/create-webhook.json"));

          scope
            .get("/api/v2/accounts/?filter[domain]=bluth.com")
            .reply(200, require("../fixtures/api-responses/outgoing-account-bluth-lookup.json"));

          // , {"data":{"type":"account","id":29,"attributes":{"domain":"bluth.com","custom1":"Real estate","name":"Bluth Company (Sample Lead)","locality":"RI"}}}
          scope
            .intercept('/api/v2/accounts/29', 'PATCH')
            .reply(200, require("../fixtures/api-responses/outgoing-account-bluth-patch.json"));


        return scope;
      },
      response: {},
      // most of the remaining "whatevers" are returned from the nock endpoints or are tested in traits
      logs: [],
      // same received user because we're mocking the return of bobba with a different user
      firehoseEvents: [],
      metrics: [],
      platformApiCalls: []
    });
  });
});
