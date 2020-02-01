// @flow
import connectorConfig from "../../../server/config";

import {
  CONNECTOR,
  connectorWithCode,
  STANDARD_SEGMENTS,
  METRIC_INCOMING_USER,
  NEXT_FLOW_CONTROL,
  USER,
  METRIC_SERVICE_REQUEST,
  METRIC_CONNECTOR_REQUEST,
  messageWithUser
} from "../../fixtures";

const path = require("path");
const testScenario = require("hull-connector-framework/src/test-scenario");

describe("Basic Attributes manipulation", () => {
  it("should group user attributes properly", () => {
    const asUser = {
      id: "1234"
    };
    const asAccount = {
      id: "1234"
    };
    const attributes = { userValue: "baz", accountValue: "ball" };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser({
        user: {
          ...asUser,
          "foo/bar": "baz"
        },
        account: {
          ...asAccount,
          "foo/bar": "ball"
        }
      }),
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(
        `hull.traits({ userValue: user.foo.bar, accountValue: account.foo.bar })`
      ),
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
          "debug",
          "incoming.user.success",
          expect.whatever(),
          { attributes, no_ops: {} }
        ]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST, METRIC_INCOMING_USER]
    }));
  });

  it("should use all the possible claims to refine resolution", () => {
    const asUser = {
      anonymous_ids: ["one", "two"],
      id: "1234",
      external_id: "foobar",
      email: "foo@bar.com"
    };
    const expectedClaims = {
      id: "1234",
      external_id: "foobar",
      email: "foo@bar.com",
      anonymous_id: "one"
    };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser({
        user: {
          ...asUser,
          "foo/bar": "baz"
        },
        account: {}
      }),
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(`hull.traits({ value: "foosball" })`),
      firehoseEvents: [
        [
          "traits",
          {
            asUser: expectedClaims,
            subjectType: "user"
          },
          { value: "foosball" }
        ]
      ],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            userTraits: [[expectedClaims, { value: "foosball" }]]
          })
        ],
        [
          "debug",
          "incoming.user.success",
          expect.whatever(),
          { attributes: { value: "foosball" }, no_ops: {} }
        ]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST, METRIC_INCOMING_USER]
    }));
  });

  it("locally omit unneeded aliases", () => {
    const asUser = {
      id: "1234",
      anonymous_ids: ["foo", "bar"]
    };
    const claims = {
      id: "1234",
      anonymous_id: "foo"
    };
    const asAccount = {
      id: "1234"
    };
    const attributes = { identical: "value" };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser({
        user: {
          ...asUser
        },
        account: {}
      }),
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(`hull.alias({ anonymous_id: "bar" })`),
      firehoseEvents: [],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            userTraits: [],
            userAliases: [[claims, [[{ anonymous_id: "bar" }, "alias"]]]]
          })
        ],
        [
          "info",
          "incoming.user.alias.success",
          expect.whatever(),
          {
            claims: { anonymous_id: "foo", id: "1234" },
            operations: [[]]
          }
        ]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST]
    }));
  });

  it("not make any call if user already has alias", () => {
    const claims = { id: "1234", anonymous_id: "foo" };
    const asAccount = { id: "1234" };
    const attributes = { identical: "value" };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser({
        user: {
          id: "1234",
          anonymous_ids: ["foo"]
        },
        account: {}
      }),
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(`hull.alias({ anonymous_id: "foo" })`),
      firehoseEvents: [],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            userTraits: [],
            userAliases: [
              [
                {
                  anonymous_id: "foo",
                  id: "1234"
                },
                [[{ anonymous_id: "foo" }, "alias"]]
              ]
            ]
          })
        ]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST]
    }));
  });

  it("locally omit identical attributes to reduce calls", () => {
    const asUser = {
      id: "1234"
    };
    const asAccount = {
      id: "1234"
    };
    const attributes = { identical: "value" };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser({
        user: {
          ...asUser,
          ...attributes
        },
        account: {}
      }),
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(`hull.traits({ identical: "value" })`),
      firehoseEvents: [],
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
          "debug",
          "incoming.user.success",
          expect.whatever(),
          { attributes: {}, no_ops: { identical: "identical value" } }
        ]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST, METRIC_INCOMING_USER]
    }));
  });

  it("locally omit ONLY identical attributes to reduce calls", () => {
    const asUser = {
      id: "1234"
    };
    const asAccount = {
      id: "1234"
    };
    const attributes = { different: "1234" };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser({
        user: {
          ...asUser,
          identical: "value",
          different: 1234
        },
        account: {}
      }),
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(
        `hull.traits({ different: "1234", identical: "value" })`
      ),
      firehoseEvents: [
        [
          "traits",
          {
            asUser,
            subjectType: "user"
          },
          attributes
        ]
      ],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            userTraits: [[asUser, { ...attributes, identical: "value" }]]
          })
        ],
        [
          "debug",
          "incoming.user.success",
          expect.whatever(),
          { attributes, no_ops: { identical: "identical value" } }
        ]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST, METRIC_INCOMING_USER]
    }));
  });

  it("be able to skip identical JSON payloads", () => {
    const asUser = {
      id: "1234"
    };
    const asAccount = {
      id: "1234"
    };
    const attributes = { foo: { bar: "baz" } };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser({
        user: {
          ...asUser,
          ...attributes
        },
        account: {}
      }),
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(`hull.traits({ "foo": { "bar": "baz" } })`),
      firehoseEvents: [],
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
          'Nested object found in key "foo"',
          expect.whatever(),
          attributes["foo"]
        ],
        [
          "debug",
          "incoming.user.success",
          expect.whatever(),
          { attributes: {}, no_ops: { foo: "identical value" } }
        ]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST, METRIC_INCOMING_USER]
    }));
  });

  it("recognizes Arrays of Objects as JSON Objects", () => {
    const asUser = {
      id: "1234"
    };
    const asAccount = {
      id: "1234"
    };
    const obj = [{ bar: "baz" }];
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser({
        user: asUser,
        account: {}
      }),
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(
        `hull.traits({ "foo": [{ "bar": "baz" }] })`
      ),
      firehoseEvents: [
        ["traits", { asUser, subjectType: "user" }, { foo: obj }]
      ],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            userTraits: [[asUser, { foo: obj }]]
          })
        ],
        ["info", 'Nested object found in key "foo"', expect.whatever(), obj],
        [
          "debug",
          "incoming.user.success",
          expect.whatever(),
          { attributes: { foo: obj }, no_ops: {} }
        ]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST, METRIC_INCOMING_USER]
    }));
  });

  it("doesn't confuse Arrays for JSON Objects", () => {
    const asUser = {
      id: "1234"
    };
    const asAccount = {
      id: "1234"
    };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser({
        user: asUser,
        account: {}
      }),
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(`hull.traits({ "foo": ["bar","baz"] })`),
      firehoseEvents: [
        [
          "traits",
          {
            asUser,
            subjectType: "user"
          },
          {
            foo: ["bar", "baz"]
          }
        ]
      ],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            userTraits: [[asUser, { foo: ["bar", "baz"] }]]
          })
        ],
        [
          "debug",
          "incoming.user.success",
          expect.whatever(),
          { attributes: { foo: ["bar", "baz"] }, no_ops: {} }
        ]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST, METRIC_INCOMING_USER]
    }));
  });

  it("be able to identify differences in JSON objects and send the full payload", () => {
    const asUser = {
      id: "1234"
    };
    const asAccount = {
      id: "1234"
    };
    const attributes = { foo: { bar: { baz: "ball" } } };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser({
        user: {
          ...asUser,
          foo: { bar: { baz: "ball", bim: "bam" } }
        },
        account: {}
      }),
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(
        `hull.traits({ foo: { bar: { baz: "ball" } } })`
      ),
      firehoseEvents: [
        [
          "traits",
          {
            asUser,
            subjectType: "user"
          },
          attributes
        ]
      ],
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
          'Nested object found in key "foo"',
          expect.whatever(),
          attributes["foo"]
        ],
        [
          "debug",
          "incoming.user.success",
          expect.whatever(),
          { attributes, no_ops: {} }
        ]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST, METRIC_INCOMING_USER]
    }));
  });

  // it("locally omit identical attributes on Accounts to reduce calls ????", () => {
  // });

  it("should handle JSON Objects", () => {
    const asUser = {
      id: "1234"
    };
    const asAccount = {
      id: "1234"
    };
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
      connector: connectorWithCode(
        "hull.traits({ userValue: user.foo.bar.baz, accountValue: account.foo.bar.baz })"
      ),
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
          "debug",
          "incoming.user.success",
          expect.whatever(),
          { attributes, no_ops: {} }
        ]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST, METRIC_INCOMING_USER]
    }));
  });

  it("should handle empty events at top level", () => {

    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser(),
      handlerType: handlers.notificationHandler,
      connector: connectorWithCode(`if(events) { console.log("hi"); }`),
      firehoseEvents: [],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.whatever()
        ]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST]
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
          "debug",
          "incoming.user.success",
          expect.whatever(),
          {
            attributes: {
              foo: "bar"
            },
            no_ops: {}
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
          "debug",
          "incoming.user.success",
          expect.whatever(),
          {
            attributes: { ...attributes, ...attributes2 },
            no_ops: {}
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
        [
          "debug",
          "incoming.user.success",
          expect.whatever(),
          { attributes, no_ops: {} }
        ]
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
          "debug",
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
          "debug",
          "incoming.account.link.success",
          expect.whatever(),
          {
            accountClaims: asAccount,
            userClaims: asUser
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

describe("Request Methods", () => {
  const user = {
    id: "1234",
    "foo/bar": "baz"
  };
  const account = {
    id: "1234",
    "foo/bar": "ball"
  };
  it("should handle request timeouts", () => {
    const error_message = "Error: ESOCKETTIMEDOUT";
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser({ user, account }),
      handlerType: handlers.notificationHandler,
      externalApiMock: () => {
        const scope = nock("https://foo.com");
        scope
          .get("/")
          .socketDelay(35000)
          .reply(500, { boom: true });
        return scope;
      },
      connector: connectorWithCode(
        `const res = await request("https://foo.com")`
      ),
      firehoseEvents: [],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            errors: [error_message]
          })
        ],
        [
          "error",
          "incoming.user.error",
          expect.whatever(),
          {
            errors: [error_message],
            hull_summary: `Error Processing user: ${error_message}`
          }
        ]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST, METRIC_SERVICE_REQUEST]
    }));
  });
  it("should handle request errors", () => {
    const error_message = '{"boom":true}';
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...messageWithUser({ user, account }),
      handlerType: handlers.notificationHandler,
      externalApiMock: () => {
        const scope = nock("https://foo.com");
        scope.get("/").reply(500, { boom: true });
        return scope;
      },
      connector: connectorWithCode(
        `const res = await request("https://foo.com")`
      ),
      firehoseEvents: [],
      logs: [
        [
          "debug",
          "compute.debug",
          expect.whatever(),
          expect.objectContaining({
            errors: [error_message]
          })
        ],
        [
          "error",
          "incoming.user.error",
          expect.whatever(),
          {
            errors: [error_message],
            hull_summary: `Error Processing user: ${error_message}`
          }
        ]
      ],
      metrics: [METRIC_CONNECTOR_REQUEST, METRIC_SERVICE_REQUEST]
    }));
  });
});
