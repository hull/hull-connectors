// @flow
declare function describe(name: string, callback: Function): void;
declare function before(callback: Function): void;
declare function beforeEach(callback: Function): void;
declare function afterEach(callback: Function): void;
declare function it(name: string, callback: Function): void;
declare function test(name: string, callback: Function): void;


const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");
import connectorConfig from "../../../server/config";


process.env.OVERRIDE_HUBSPOT_URL = "";

const incomingData = require("../fixtures/get-contacts-recently-updated");

const connector = {
  private_settings: {
    token: "hubToken",
    token_fetched_at: 1419967066626,
    expires_in: 10
  }
};

it("should handle error during token refresh", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.scheduleHandler,
      handlerUrl: "monitor/checkToken",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        return scope;
      },
      connector,
      usersSegments: [],
      accountsSegments: [],
      response: {"status": "deferred"},
      logs: [
        [
          "debug",
          "access_token",
          {},
          expect.whatever()
        ]
      ],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "connector.transient_error", 1]
      ],
      platformApiCalls: []
    };
  });
});
