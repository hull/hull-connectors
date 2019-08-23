// @flow
import connectorConfig from "../../../server/config";

import {
  CONNECTOR,
  connectorWithCode,
  STANDARD_SEGMENTS,
  METRIC_INCOMING_USER,
  NEXT_FLOW_CONTROL,
  USER,
  METRIC_CONNECTOR_REQUEST,
  messageWithUser
} from "../../fixtures";

const path = require("path");
const testScenario = require("hull-connector-framework/src/test-scenario");

describe("Basic Attributes manipulation", () => {
  it("should expose lodash, console, moment, urijs", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser({
        user: {
          ...USER,
          created_at: "2010-01-02T10:00:00Z",
          url: "http://example.org/foo/bar.html",
          foo: ["a", "b", "c"]
        }
      }),
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(`
        console.log(_.first(user.foo));
        console.log(urijs(user.url).path());
        console.log(moment(user.created_at).format("MM/YYYY"));
        console.warn("warn");
        console.error("error");
        console.info("info");
      `),
      firehoseEvents: [],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            logs: [
              ["a"],
              ["/foo/bar.html"],
              ["01/2010"],
              ["warn"],
              ["error"],
              ["info"]
            ],
            logsForLogger: [["info"]]
          })
        ],
        [
          "error",
          "incoming.user.error",
          expect.whatever(),
          expect.objectContaining({
            errors: [["error"]],
            hull_summary: "Error Processing user: error"
          })
        ],
        [
          "info",
          "compute.console.log",
          expect.whatever(),
          expect.objectContaining({
            log: ["info"]
          })
        ]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST]
    }));
  });

  it("should expose segment detection methods", () => {
    const segmentFoo = {
      id: "1234",
      name: "foo",
      created_at: "",
      updated_at: "",
      type: "users_segment"
    };
    const segmentBar = {
      id: "4567",
      name: "bar",
      created_at: "",
      updated_at: "",
      type: "users_segment"
    };
    const accountSegmentBaz = {
      id: "4567",
      name: "baz",
      created_at: "",
      updated_at: "",
      type: "accounts_segment"
    };
    const accountSegmentBall = {
      id: "4567",
      name: "ball",
      created_at: "",
      updated_at: "",
      type: "accounts_segment"
    };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser({
        changes: {
          is_new: false,
          account: {},
          user: {},
          account_segments: {
            entered: [accountSegmentBaz],
            left: [accountSegmentBall]
          },
          segments: {
            entered: [segmentFoo],
            left: [segmentBar]
          }
        },
        segments: [segmentFoo],
        account_segments: [accountSegmentBaz]
      }),
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(`
        console.log(isInSegment("foo"));
        console.log(isInSegment("bar"));

        console.log(enteredSegment("foo"));
        console.log(leftSegment("foo"));

        console.log(leftSegment("bar"));
        console.log(enteredSegment("bar"));

        console.log(isInAccountSegment("baz"));
        console.log(isInAccountSegment("ball"));

        console.log(enteredAccountSegment("baz"));
        console.log(leftAccountSegment("baz"));

        console.log(leftAccountSegment("ball"));
        console.log(enteredAccountSegment("ball"));
      `),
      firehoseEvents: [],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            logs: [
              [true],
              [false],
              [true],
              [false],
              [true],
              [false],
              [true],
              [false],
              [true],
              [false],
              [true],
              [false]
            ]
          })
        ]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST]
    }));
  });
});
