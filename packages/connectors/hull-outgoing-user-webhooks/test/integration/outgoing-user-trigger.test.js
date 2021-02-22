/* @flow */
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";
const testScenario = require("hull-connector-framework/src/test-scenario");
const { createSimpleTriggerScenario } = require("hull-webhooks/test/trigger-scenario");
import connectorConfig from "../../server/config";
import manifest from "../../manifest.json";

describe("Outgoing Users Tests", () => {

  it("User Created. Should Send Payload", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "is_new_user" });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("http://example.com");

          scope
            .post("/mock", {
              email: "bob@bobby.com"
            })
            .reply(200, {
              status: 200
            });

          return scope;
        },
        response: triggerScenario.getExpectedResponse(),
        logs: triggerScenario.getExpectedLogs(),
        firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
        metrics: triggerScenario.getExpectedMetrics(),
        platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
      });
    });
  });

  it("User Entered Segment. Should Send Payload", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "user_segments_entered" });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("http://example.com");

          scope
            .post("/mock", {
              email: "bob@bobby.com"
            })
            .reply(200, {
              status: 200
            });

          return scope;
        },
        response: triggerScenario.getExpectedResponse(),
        logs: triggerScenario.getExpectedLogs(),
        firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
        metrics: triggerScenario.getExpectedMetrics(),
        platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
      });
    });
  });

  it("User Left Segment. Should Send Payload", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "user_segments_left" });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("http://example.com");

          scope
            .post("/mock", {
              email: "bob@bobby.com"
            })
            .reply(200, {
              status: 200
            });

          return scope;
        },
        response: triggerScenario.getExpectedResponse(),
        logs: triggerScenario.getExpectedLogs(),
        firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
        metrics: triggerScenario.getExpectedMetrics(),
        platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
      });
    });
  });

  it("Whitelisted User Attribute Changed. Should Send Payload", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "user_attribute_updated" });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("http://example.com");

          scope
            .post("/mock", {
              email: "bob@bobby.com"
            })
            .reply(200, {
              status: 200
            });

          return scope;
        },
        response: triggerScenario.getExpectedResponse(),
        logs: triggerScenario.getExpectedLogs(),
        firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
        metrics: triggerScenario.getExpectedMetrics(),
        platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
      });
    });
  });

  it("Whitelisted User Event Occurred. Should Send Payload", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "user_events" });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("http://example.com");

          scope
            .post("/mock", {
              email: "bob@bobby.com"
            })
            .reply(200, {
              status: 200
            });

          return scope;
        },
        response: triggerScenario.getExpectedResponse(),
        logs: triggerScenario.getExpectedLogs(),
        firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
        metrics: triggerScenario.getExpectedMetrics(),
        platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
      });
    });
  });

  /*
  TODO: UNSUPPORTED SCENARIOS:

  it("User Left Single Synchronized Segment. Should Send Payload", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

      const private_settings = {
        "synchronized_user_segments_leave": ["segment_left"],
        "synchronized_user_segments": ["segment_left"]
      };

      const triggerScenario = createSimpleTriggerScenario({ trigger: "user_left_segment", settingsOverwrite: private_settings });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("http://example.com");

          scope
            .post("/mock", {
              email: "bob@bobby.com"
            })
            .reply(200, {
              status: 200
            });

          return scope;
        },
        response: triggerScenario.getExpectedResponse(),
        logs: triggerScenario.getExpectedLogs(),
        firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
        metrics: triggerScenario.getExpectedMetrics(),
        platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
      });
    });
  });

  it("User Account {Attribute|Segment} Changed. Should Send Payload", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "user_account_attribute_updated");

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("http://example.com");

          scope
            .post("/mock", {
              email: "bob@bobby.com"
            })
            .reply(200, {
              status: 200
            });

          return scope;
        },
        response: triggerScenario.getExpectedResponse(),
        logs: triggerScenario.getExpectedLogs(),
        firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
        metrics: triggerScenario.getExpectedMetrics(),
        platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
      });
    });
  });
   */

  // NEGATIVES

  it("User in whitelisted segment with no other trigger defined. Should Not Send Payload", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "user_synchronized_segment", negative: true });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {},
        response: triggerScenario.getExpectedResponse(),
        logs: triggerScenario.getExpectedLogs(),
        firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
        metrics: triggerScenario.getExpectedMetrics(),
        platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
      });
    });
  });

  it("User entered non synchronized segment. Should Not Send Payload", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "user_segments_entered", negative: true });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {},
        response: triggerScenario.getExpectedResponse(),
        logs: triggerScenario.getExpectedLogs(),
        firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
        metrics: triggerScenario.getExpectedMetrics(),
        platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
      });
    });
  });

  it("User leaves non synchronized segment. Should Not Send Payload", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "user_segments_left", negative: true });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {},
        response: triggerScenario.getExpectedResponse(),
        logs: triggerScenario.getExpectedLogs(),
        firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
        metrics: triggerScenario.getExpectedMetrics(),
        platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
      });
    });
  });

  it("Non Whitelisted User Attribute Changed. Should Not Send Payload", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "user_attribute_updated", negative: true });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {},
        response: triggerScenario.getExpectedResponse(),
        logs: triggerScenario.getExpectedLogs(),
        firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
        metrics: triggerScenario.getExpectedMetrics(),
        platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
      });
    });
  });

  it("Not Whitelisted User Event Occurred. Should Not Send Payload", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "user_events", negative: true });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {},
        response: triggerScenario.getExpectedResponse(),
        logs: triggerScenario.getExpectedLogs(),
        firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
        metrics: triggerScenario.getExpectedMetrics(),
        platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
      });
    });
  });

  it("Should send user with events and 'All Events' whitelist", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "user_events_all" });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("http://example.com");

          scope
            .post("/mock", {
              email: "bob@bobby.com"
            })
            .reply(200, {
              status: 200
            });

          return scope;
        },
        response: triggerScenario.getExpectedResponse(),
        logs: triggerScenario.getExpectedLogs(),
        firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
        metrics: triggerScenario.getExpectedMetrics(),
        platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
      });
    });
  });

  it("Should not send user without events and 'All Events' whitelist", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "user_events_all", negative: true });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {},
        response: triggerScenario.getExpectedResponse(),
        logs: triggerScenario.getExpectedLogs(),
        firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
        metrics: triggerScenario.getExpectedMetrics(),
        platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
      });
    });
  });
});
