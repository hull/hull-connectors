// @flow
import connectorConfig from "../../../server/config";

import {
  CONNECTOR,
  connectorWithCode,
  STANDARD_SEGMENTS,
  METRIC_INCOMING_USER,
  METRIC_INCOMING_EVENT,
  NEXT_FLOW_CONTROL,
  USER,
  METRIC_CONNECTOR_REQUEST,
  METRIC_SERVICE_REQUEST,
  METRIC_SERVICE_REQUEST_SHIP,
  METRIC_SERVICE_REQUEST_ERROR,
  messageWithUser
} from "../../fixtures";

const testScenario = require("hull-connector-framework/src/test-scenario");

describe("Superagent library", () => {
  it("should expose superagent and parse JSON when asked", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser(),
      externalApiMock: () => {
        const scope = nock("http://foobar.com");
        // scope.delay({ head: 150 })
        scope.get("/email").reply(200, { email: "foo@bar.com" });
      },
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(`
        return superagent
            .get("http://foobar.com/email")
            .set('accept', 'json')
            .then(res => {
              console.log(res.body.email)
            })
      `),
      firehoseEvents: [],
      logs: [
        [
          "debug",
          "connector.service_api.call",
          expect.whatever(),
          expect.objectContaining({
            url: "http://foobar.com/email",
            method: "GET"
          })
        ],
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            logs: [["foo@bar.com"]]
          })
        ]
      ],
      metrics: [
        METRIC_CONNECTOR_REQUEST,
        METRIC_SERVICE_REQUEST,
        METRIC_SERVICE_REQUEST_SHIP,
        expect.whatever() // Response time metric
      ]
    }));
  });

  it("should allow posting data", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser(),
      externalApiMock: () => {
        nock("http://foobar.com")
          .post("/email")
          .reply(200, function(uri, requestBody) {
            return { result: requestBody.foo };
          });
      },
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(`
        return superagent
          .post("http://foobar.com/email")
          .set('accept', 'json')
          .send({
            foo: "bar"
          })
          .then(res => {
            console.log(res.body.result)
          })
      `),
      firehoseEvents: [],
      logs: [
        [
          "debug",
          "connector.service_api.call",
          expect.whatever(),
          expect.objectContaining({
            url: "http://foobar.com/email",
            method: "POST"
          })
        ],
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            logs: [["bar"]]
          })
        ]
      ],
      metrics: [
        METRIC_CONNECTOR_REQUEST,
        METRIC_SERVICE_REQUEST,
        METRIC_SERVICE_REQUEST_SHIP,
        expect.whatever() // Response time metric
      ]
    }));
  });

  it("should handle async await", () => {
    const error = {
      message: "something awful happened",
      code: "AWFUL_ERROR"
    };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser(),
      externalApiMock: () => {
        nock("http://foobar.com")
          .get("/success_out")
          .reply(200, { success: true });
      },
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(`
        const response = await superagent
          .get("http://foobar.com/success_out")
          .set('accept', 'json');
        console.log(response.body);
        hull.traits(response.body);
        hull.track("Response", response.body);
      `),
      firehoseEvents: [
        [
          "traits",
          {
            asUser: { id: "1234" },
            subjectType: "user"
          },
          {
            success: true
          }
        ],
        [
          "track",
          {
            asUser: { id: "1234" },
            subjectType: "user"
          },
          {
            event_id: expect.anything(),
            ip: "0",
            referer: null,
            url: null,
            source: "processor",
            event: "Response",
            properties: {
              success: true
            }
          }
        ]
      ],
      logs: [
        [
          "debug",
          "connector.service_api.call",
          expect.whatever(),
          expect.objectContaining({
            url: "http://foobar.com/success_out",
            method: "GET"
          })
        ],
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            errors: [],
            logs: [[{ success: true }]],
            userTraits: [
              [
                {
                  id: "1234"
                },
                {
                  success: true
                }
              ]
            ],
            isAsync: true,
            events: [
              {
                claims: {
                  id: "1234"
                },
                event: {
                  context: {
                    source: "processor"
                  },
                  eventName: "Response",
                  properties: {
                    success: true
                  }
                }
              }
            ]
          })
        ],
        [
          "debug",
          "incoming.user.success",
          expect.whatever(),
          expect.objectContaining({
            attributes: {
              success: true
            },
            no_ops: {}
          })
        ],
        [
          "debug",
          "incoming.event.success",
          expect.whatever(),
          expect.objectContaining({
            eventName: "Response",
            properties: {
              success: true
            }
          })
        ]
      ],
      metrics: [
        METRIC_CONNECTOR_REQUEST,
        METRIC_SERVICE_REQUEST,
        METRIC_SERVICE_REQUEST_SHIP,
        expect.whatever(), // Response time metric
        METRIC_INCOMING_USER,
        METRIC_INCOMING_EVENT
      ]
    }));
  });

  it("should handle errors", () => {
    const error = {
      message: "something awful happened",
      code: "AWFUL_ERROR"
    };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser(),
      externalApiMock: () => {
        nock("http://foobar.com")
          .get("/error_out")
          .replyWithError({ error });
      },
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(`
        return superagent
          .get("http://foobar.com/error_out")
          .set('json', 'true')
          .then(res => {
            console.log(res.body)
          })
      `),
      firehoseEvents: [],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            errors: [error]
          })
        ],
        // [
        //   "debug",
        //   "connector.service_api.call",
        //   expect.whatever(),
        //   expect.objectContaining({
        //     url: "http://foobar.com/error_out",
        //     method: "GET"
        //   })
        // ],
        [
          "error",
          "incoming.user.error",
          expect.whatever(),
          expect.objectContaining({
            errors: [error],
            hull_summary:
              'Error Processing user: {"message":"something awful happened","code":"AWFUL_ERROR"}'
          })
        ]
      ],
      metrics: [
        METRIC_CONNECTOR_REQUEST,
        METRIC_SERVICE_REQUEST,
        METRIC_SERVICE_REQUEST_ERROR
      ]
    }));
  });

  it("should allow handling errors", () => {
    const error = {
      message: "something awful happened",
      code: "AWFUL_ERROR"
    };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser(),
      externalApiMock: () => {
        nock("http://foobar.com")
          .get("/handlerror")
          .replyWithError(error);
      },
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(`
        return superagent
          .get("http://foobar.com/handlerror")
          .set('json', 'true')
          .catch(res => {
            console.log(res)
          })
      `),
      firehoseEvents: [],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            logs: [[error]]
          })
        ]
      ],
      metrics: [
        METRIC_CONNECTOR_REQUEST,
        METRIC_SERVICE_REQUEST,
        METRIC_SERVICE_REQUEST_ERROR
      ]
    }));
  });

  it("should return Timeout error when calling 3rd party API that timeouts", () => {
    const error = "Error: Response timeout of 3000ms exceeded";
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser(),
      externalApiMock: () => {
        nock("http://foobar.com")
          .get("/timeout")
          .delay({ head: 3001 })
          .reply(503, "timeout");
        nock("http://foobar.com")
          .get("/timeout")
          .delay({ head: 3001 })
          .reply(503, "timeout");
        nock("http://foobar.com")
          .get("/timeout")
          .delay({ head: 3001 })
          .reply(503, "timeout");
      },
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(`
        return superagent
          .get("http://foobar.com/timeout")
          .set('json', 'true')
          .then(res => {
            console.log(JSON.stringify(res))
          })
      `),
      firehoseEvents: [],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            errors: [expect.stringContaining(error)]
          })
        ],
        [
          "error",
          "incoming.user.error",
          expect.whatever(),
          expect.objectContaining({
            errors: [expect.stringContaining(error)],
            hull_summary: expect.stringContaining(
              `Error Processing user: ${error}`
            )
          })
        ]
      ],
      metrics: [
        METRIC_CONNECTOR_REQUEST,
        METRIC_SERVICE_REQUEST,
        METRIC_SERVICE_REQUEST_ERROR
      ]
    }));
  }).timeout(10000);
});
