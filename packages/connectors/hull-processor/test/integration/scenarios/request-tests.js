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
  messageWithUser
} from "../../fixtures";

const testScenario = require("hull-connector-framework/src/test-scenario");

describe("Request library", () => {
  it("should expose request-promise and parse JSON when asked", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser(),
      externalApiMock: () => {
        const scope = nock("http://foobar.com");
        // scope.delay({ head: 150 })
        scope.get("/email").reply(200, { email: "foo@bar.com" });
      },
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(`
        return request({
          uri: "http://foobar.com/email",
          json: true
        }).then(res => {
          console.log(res.email)
        })
      `),
      firehoseEvents: [],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            logs: [["foo@bar.com"]]
          })
        ]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST]
    }));
  });

  it("should allow posting data", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser(),
      externalApiMock: () => {
        nock("http://foobar.com")
          .post("/email")
          .reply(function(uri, requestBody) {
            return { result: requestBody.foo };
          });
      },
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(`
        return request({
          uri: "http://foobar.com/email",
          method: "POST",
          json: true,
          body: {
            foo: "bar"
          }
        }).then(res => {
          console.log(res.result)
        })
      `),
      firehoseEvents: [],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            logs: [["bar"]]
          })
        ]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST]
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
        const response = await request({
          uri: "http://foobar.com/success_out",
          json: true
        });
        console.log(response);
        hull.traits(response);
        hull.track("Response", response);
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
          "info",
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
          "info",
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
          .replyWithError(error);
      },
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(`
        return request({
          uri: "http://foobar.com/error_out",
          json: true
        }).then(res => {
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
            errors: [error]
          })
        ],
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
      metrics: [METRIC_CONNECTOR_REQUEST]
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
        return request({
          uri: "http://foobar.com/handlerror",
          json: true
        }).catch(res => {
          console.log(res.error)
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
      metrics: [METRIC_CONNECTOR_REQUEST]
    }));
  });

  it("should return http 503 - gateway timeout in case of 3rd part API timeout", () => {
    const error = "Error: ESOCKETTIMEDOUT";
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser(),
      externalApiMock: () => {
        nock("http://foobar.com")
          .get("/timeout")
          .delay({ head: 3001 })
          .reply(503, "timeout");
      },
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(`
        return request({
          uri: "http://foobar.com/timeout",
          json: true
        }).then(res => {
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
            errors: [error]
          })
        ],
        [
          "error",
          "incoming.user.error",
          expect.whatever(),
          expect.objectContaining({
            errors: [error],
            hull_summary: "Error Processing user: Error: ESOCKETTIMEDOUT"
          })
        ]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST]
    }));
  });
});
