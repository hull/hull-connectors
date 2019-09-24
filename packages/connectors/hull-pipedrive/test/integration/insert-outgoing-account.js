/* @flow */
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";
const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../server/config";


it("Insert Single Account To Pipedrive", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    const updateMessages = require("./fixtures/notifier-payloads/new-single-account");
    return _.assign(updateMessages, {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "account:update",
      externalApiMock: () => {
        const scope = nock("https://api-proxy.pipedrive.com");

        scope
          .post("/organizations")
          .reply(201, require("./fixtures/pipedrive/account_response"));

        return scope;
      },
      response: {
        flow_control: {
          type: "next",
          in: 5,
          in_time: 10,
          size: 10,
        }
      },
      logs: [],
      firehoseEvents: [],
      metrics: [],
      platformApiCalls: []
    });
  });
});

