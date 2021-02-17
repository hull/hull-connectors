// @flow

import connectorConfig from "../../../server/config";
import manifest from "../../../manifest.json";

const testScenario = require("hull-connector-framework/src/test-scenario");

// workaround to allow connector start
process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";

test("fetch forms using pagination", () => {
  return testScenario(
    { manifest, connectorConfig },
    ({ handlers, requireFixture, expect, nock }) => {
      return {
        handlerType: handlers.jsonHandler,
        handlerUrl: "schema/forms",
        externalApiMock: () => {
          const scope = nock("https://api.typeform.com");
          scope
            .get("/forms")
            .query({ page: 1 })
            .reply(200, {
              items: [
                  require("../fixtures/example-form")
                ]
            });
          scope
            .get("/forms")
            .query({ page: 2 })
            .reply(200, {
              items: [
                require("../fixtures/example-form")
              ]
            });
          scope
            .get("/forms")
            .query({ page: 3 })
            .reply(200, { items: [] });
          return scope;
        },
        connector: {
          private_settings: {
            form_id: "TYPEFORM1",
            field_as_email: "SMEUb7VJz92Q"
          }
        },
        usersSegments: [],
        accountsSegments: [],
        response: {
          options: [
            {
              label: "title",
              value: "FORM1"
            },
            {
              label: "title",
              value: "FORM1"
            }
          ]
        },
        logs: [
          [
            "debug",
            "connector.service_api.call",
            {},
            {
              "method": "GET",
              "responseTime": expect.whatever(),
              "status": 200,
              "url": "/forms",
              "vars": {}
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {},
            {
              "method": "GET",
              "responseTime": expect.whatever(),
              "status": 200,
              "url": "/forms",
              "vars": {}
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {},
            {
              "method": "GET",
              "responseTime": expect.whatever(),
              "status": 200,
              "url": "/forms",
              "vars": {}
            }
          ]
        ],
        metrics: [
          [
            "increment",
            "connector.request",
            1
          ],
          [
            "increment",
            "ship.service_api.call",
            1
          ],
          [
            "value",
            "connector.service_api.response_time",
            expect.whatever()
          ],
          [
            "increment",
            "ship.service_api.call",
            1
          ],
          [
            "value",
            "connector.service_api.response_time",
            expect.whatever()
          ],
          [
            "increment",
            "ship.service_api.call",
            1
          ],
          [
            "value",
            "connector.service_api.response_time",
            expect.whatever()
          ]
        ],
        firehoseEvents: [

        ],
        platformApiCalls: [
          ["GET", "/api/v1/app", {}, {}],
          ["GET", "/api/v1/users_segments?shipId=9993743b22d60dd829001999", {"shipId": "9993743b22d60dd829001999"}, {}],
          ["GET", "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999", {"shipId": "9993743b22d60dd829001999"}, {}]
        ]
      };
    }
  );
});
