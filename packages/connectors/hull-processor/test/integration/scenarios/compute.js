// @flow
import connectorConfig from "../../../server/config";

const path = require("path");
const testScenario = require("hull-connector-framework/src/test-scenario");

const connector = {
  id: "123456789012345678901234",
  private_settings: {}
};
const connectorWithCode = code => ({
  ...connector,
  private_settings: { ...connector.private_settings, code }
});

const STANDARD_SEGMENTS = [{ id: "hullSegmentId", name: "hullSegmentName" }];

const NEXT_FLOW_CONTROL = {
  type: "next",
  in: 10,
  size: 100
};

const SMART_NOTIFIER_MESSAGE = {
  handlerUrl: "smart-notifier",
  channel: "user:update",
  externalApiMock: () => {},
  usersSegments: [],
  accountsSegments: [],
  messages: [
    {
      user: {
        id: 1234,
        email: "foo@bar.com"
      },
      segments: STANDARD_SEGMENTS
    }
  ],
  response: {
    flow_control: NEXT_FLOW_CONTROL
  }
};

describe("Basic Attributes manipulation", () => {
  it("should apply a simple attribute to a user", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...SMART_NOTIFIER_MESSAGE,
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode('traits({ foo: "bar" })'),
      firehoseEvents: [
        [
          "traits",
          { asUser: { id: 1234 }, subjectType: "user" },
          { foo: "bar" }
        ]
      ],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            userTraits: [[{ id: 1234 }, { foo: "bar" }]]
          })
        ],
        [
          "info",
          "incoming.user.success",
          expect.whatever(),
          {
            attributes: {
              foo: "bar"
            }
          }
        ]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.incoming.users", 1]
      ]
    }));
  });
});
