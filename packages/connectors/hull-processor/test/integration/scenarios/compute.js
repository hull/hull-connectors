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

const USER = {
  id: 1234,
  email: "foo@bar.com",
  domain: "bar.com"
};

const SMART_NOTIFIER_MESSAGE = {
  handlerUrl: "smart-notifier",
  channel: "user:update",
  externalApiMock: () => {},
  usersSegments: [],
  accountsSegments: [],
  messages: [
    {
      user: USER,
      segments: STANDARD_SEGMENTS
    }
  ],
  response: {
    flow_control: NEXT_FLOW_CONTROL
  }
};

describe("Basic Attributes manipulation", () => {
  it("should apply a simple attribute to a user", () =>
    testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
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
    })));

  it("should apply a simple event to a user", () =>
    testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...SMART_NOTIFIER_MESSAGE,
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode('track("New Event", { foo: "bar" })'),
      firehoseEvents: [
        [
          "track",
          { asUser: { id: 1234 }, subjectType: "user" },
          {
            event: "New Event",
            event_id: expect.anything(),
            ip: "0",
            referer: null,
            url: null,
            source: "processor",
            properties: { foo: "bar" }
          }
        ]
      ],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            events: [
              {
                claims: { id: 1234 },
                event: {
                  properties: { foo: "bar" },
                  context: { source: "processor" },
                  eventName: "New Event"
                }
              }
            ]
          })
        ],
        [
          "info",
          "incoming.event.success",
          expect.whatever(),
          {
            eventName: "New Event",
            properties: {
              foo: "bar"
            }
          }
        ]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.incoming.events", 1]
      ]
    })));

  it("should send an account link to the firehose", () =>
    testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...SMART_NOTIFIER_MESSAGE,
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode("account({ domain: user.domain })"),
      // TODO: This should really exist as a Firehose method as "link"
      firehoseEvents: [
        [
          "traits",
          {
            asUser: { id: 1234 },
            asAccount: { domain: "bar.com" },
            subjectType: "account"
          },
          {}
        ]
      ],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            accountLinks: [[{ id: 1234 }, { domain: "bar.com" }]]
          })
        ],
        [
          "info",
          "incoming.account.link.success",
          expect.whatever(),
          {
            accountClaims: { domain: "bar.com" },
            claims: { id: 1234 }
          }
        ]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.incoming.accounts.link", 1]
      ]
    })));
});
