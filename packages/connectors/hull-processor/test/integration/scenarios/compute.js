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
  it("should group user attributes properly", () => {
    const asUser = { id: "1234" };
    const attributes = { userValue: "baz", accountValue: "ball" };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser({
        user: {
          ...asUser,
          "foo/bar": "baz"
        },
        account: {
          id: "1234",
          "foo/bar": "ball"
        }
      }),
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(`hull.traits({ userValue: user.foo.bar, accountValue: account.foo.bar })`),
      firehoseEvents: [["traits", { asUser, subjectType: "user" }, attributes]],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            userTraits: [[asUser, attributes]]
          })
        ],
        ["info", "incoming.user.success", expect.whatever(), { attributes }]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST, METRIC_INCOMING_USER]
    }));
  });

  it("should handle JSON Objects", () => {
    const asUser = { id: "1234" };
    const asAccount = { id: "1234" };
    const attributes = { userValue: "bat", accountValue: "ball" };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser({
        user: {
          ...asUser,
          "foo/bar": {
            baz: "bat"
          }
        },
        account: {
          ...asAccount,
          "foo/bar": {
            baz: "ball"
          }
        }
      }),
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode("hull.traits({ userValue: user.foo.bar.baz, accountValue: account.foo.bar.baz })"),
      firehoseEvents: [["traits", { asUser, subjectType: "user" }, attributes]],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            userTraits: [[asUser, attributes]]
          })
        ],
        ["info", "incoming.user.success", expect.whatever(), { attributes }]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST, METRIC_INCOMING_USER]
    }));
  });

  it("should apply a simple attribute to a user", () => {
    const asUser = { id: "1234" };
    const attributes = { foo: "bar" };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser(),
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(`traits(${JSON.stringify(attributes)})`),
      firehoseEvents: [["traits", { asUser, subjectType: "user" }, attributes]],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            userTraits: [[asUser, attributes]]
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
      metrics: [METRIC_CONNECTOR_REQUEST, METRIC_INCOMING_USER]
    }));
  });

  it("should work as top level or scoped methods", () => {
    const asUser = { id: "1234" };
    const attributes = { foo: "bar" };
    const attributes2 = { faa: "baz" };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser(),
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(
        `traits(${JSON.stringify(attributes)}); hull.traits(${JSON.stringify(
          attributes2
        )})`
      ),
      firehoseEvents: [
        [
          "traits",
          { asUser, subjectType: "user" },
          { ...attributes, ...attributes2 }
        ]
      ],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            userTraits: [[asUser, { ...attributes, ...attributes2 }]]
          })
        ],
        [
          "info",
          "incoming.user.success",
          expect.whatever(),
          {
            attributes: { ...attributes, ...attributes2 }
          }
        ]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST, METRIC_INCOMING_USER]
    }));
  });

  it("should flatten a single level deep", () => {
    const asUser = { id: "1234" };
    const attributes = {
      "group/value": "val0",
      "group/group": {
        value: "val1",
        group: {
          value: "val2"
        }
      }
    };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser(),
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(
        "hull.traits({ value: 'val0', group: { value: 'val1', group: { value: 'val2' } } }, { source: 'group' });"
      ),
      firehoseEvents: [["traits", { asUser, subjectType: "user" }, attributes]],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({ userTraits: [[asUser, attributes]] })
        ],
        [
          "info",
          'Nested object found in key "group/group"',
          expect.whatever(),
          attributes["group/group"]
        ],
        ["info", "incoming.user.success", expect.whatever(), { attributes }]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST, METRIC_INCOMING_USER]
    }));
  });

  it("should apply a simple event to a user", () => {
    const asUser = { id: "1234" };
    const attributes = { foo: "bar" };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser(),
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode('hull.track("New Event", { foo: "bar" })'),
      firehoseEvents: [
        [
          "track",
          { asUser, subjectType: "user" },
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
                claims: { id: "1234" },
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
        METRIC_CONNECTOR_REQUEST,
        ["increment", "ship.incoming.events", 1]
      ]
    }));
  });

  it("should send an account link to the firehose", () => {
    const asUser = { id: "1234" };
    const attributes = { foo: "bar" };
    const asAccount = { domain: "bar.com" };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser({
        user: {
          ...asUser,
          domain: "bar.com"
        }
      }),
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode("hull.account({ domain: user.domain })"),
      // TODO: This should really exist as a Firehose method as "link"
      firehoseEvents: [
        [
          "traits",
          {
            asUser,
            asAccount,
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
            accountLinks: [[asUser, asAccount]]
          })
        ],
        [
          "info",
          "incoming.account.link.success",
          expect.whatever(),
          {
            accountClaims: asAccount,
            claims: asUser
          }
        ]
      ],
      metrics: [
        METRIC_CONNECTOR_REQUEST,
        ["increment", "ship.incoming.accounts.link", 1]
      ]
    }));
  });
});
