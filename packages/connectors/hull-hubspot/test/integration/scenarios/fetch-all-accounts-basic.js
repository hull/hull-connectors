// @flow
/* global describe, it, beforeEach, afterEach */
declare function describe(name:string, callback:Function):void;
declare function before(callback:Function):void;
declare function beforeEach(callback:Function):void;
declare function it(name:string, callback:Function):void;

const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");

const connectorServer = require("../../../server/server");
const connectorManifest = require("../../../manifest");

process.env.OVERRIDE_HUBSPOT_URL = "";

const incomingData = require("../fixtures/get-companies-recent-modified");

const connector = {
  private_settings: {
    token: "hubToken",
    handle_accounts: true
  }
};

it.skip("should fetch all companies", () => {
  return testScenario({ connectorServer, connectorManifest }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.scheduleHandler,
      handlerUrl: "fetch-recent-companies",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/contacts/v2/groups?includeProperties=true")
          .reply(200, []);
        scope.get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, []);
        scope.get("/companies/v2/companies/recent/modified?count=100&offset")
          .reply(200, incomingData);
        return scope;
      },
      connector,
      usersSegments: [],
      accountsSegments: [],
      response: "",
      logs: [
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        [
          "info",
          "incoming.job.start",
          expect.whatever(),
          {
            jobName: "fetch",
            lastFetchAt: 1419967066626,
            propertiesToFetch: ["domain"],
            stopFetchAt: expect.whatever(),
            type: "account"
          }
        ],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "GET", "status": 200, "url": "/companies/v2/companies/recent/modified" })],
        ["info", "incoming.job.progress", {}, { jobName: "fetch", progress: 2, type: "account" }],
        ["debug", "saveContacts", {}, 2],
        [
          "debug",
          "incoming.account",
          {},
          {
            claims: { domain: "foo.com" },
            traits: { "hubspot/id": 19411477, name: { operation: "setIfNull", value: "madison Inc" } }
          }
        ],
        [
          "info",
          "incoming.account.skip",
          {},
          {
            company: incomingData.results[1],
            reason: "Value of field \"properties.domain.value\" is empty, cannot map it to domain, but it's required."
          }
        ],
        [
          "info",
          "incoming.account.success",
          expect.objectContaining({ "subject_type": "account", "account_domain": "foo.com" }),
          {
            traits: {
              "hubspot/id": 19411477,
              name: {
                operation: "setIfNull",
                value: "madison Inc"
              }
            }
          }
        ],
        [
          "info",
          "incoming.account.link.skip",
          {
            account_domain: "foo.com",
            subject_type: "account"
          },
          {
            reason: "incoming linking is disabled, you can enabled it in the settings"
          }
        ],
        [
          "info",
          "incoming.job.success",
          {},
          {
            "jobName": "fetch",
          }
        ]
      ],
      firehoseEvents: [
        [
          "traits",
          {
            "asAccount": {
              "domain": "foo.com",
            },
            "subjectType": "account",
          },
          {
            "hubspot/id": 19411477,
            "name": {
              "operation": "setIfNull",
              "value": "madison Inc"
            }
          }
        ]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.incoming.accounts", 2]
      ],
      platformApiCalls: [
        ["GET", "/api/v1/search/user_reports/bootstrap", {}, {}],
        ["GET", "/api/v1/search/account_reports/bootstrap", {}, {}],
        ["GET", "/api/v1/app", {}, {}],
        [
          "PUT",
          "/api/v1/9993743b22d60dd829001999",
          {},
          {
            "private_settings": {
              "companies_last_fetch_at": expect.whatever(),
              "fetch_accounts": true,
              "incoming_account_claims": [
                {
                  "hull": "domain",
                  "required": true,
                  "service": "properties.domain.value"
                },
              ],
              "token": "hubToken"
            }
          }
        ]
      ]
    };
  });
});
