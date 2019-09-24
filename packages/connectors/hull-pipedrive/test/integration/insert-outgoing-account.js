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
      logs: [
        [
          "info",
          "outgoing.job.start",
          {
            "request_id": expect.whatever()
          },
          {
            "jobName": "Outgoing Data",
            "type": "account"
          }
        ],
        [
          "debug",
          "connector.service_api.call",
          {
            "request_id": expect.whatever()
          },
          {
            "responseTime": expect.whatever(),
            "method": "POST",
            "url": "/organizations",
            "status": 201,
            "vars": {}
          }
        ],
        [
          "info",
          "outgoing.account.success",
          {
            "subject_type": "account",
            "account_id": "account_id_2",
            "request_id": expect.whatever(),
            "account_domain": "apple.com"
          },
          {
            "data": {
              "address": "123 Random Pl"
            },
            "type": "Org",
            "operation": "post"
          }
        ],
        [
          "info",
          "outgoing.job.success",
          {
            "request_id": expect.whatever()
          },
          {
            "jobName": "Outgoing Data",
            "type": "account"
          }
        ]
      ],
      firehoseEvents: [],
      metrics:   [
        [
          "increment",
          "connector.request",
          1,
        ],
        [
          "increment",
          "ship.service_api.call",
          1,
        ],
        [
          "value",
          "connector.service_api.response_time",
          expect.whatever(),
        ],
      ],
      platformApiCalls: []
    });
  });
});

