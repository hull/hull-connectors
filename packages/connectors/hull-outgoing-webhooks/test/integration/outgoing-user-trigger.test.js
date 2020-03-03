/* @flow */
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";
const testScenario = require("hull-connector-framework/src/test-scenario");
const { createSimpleTriggerScenario } = require("../trigger-scenario");
import connectorConfig from "../../server/config";

describe("Outgoing Users Tests", () => {

  it("User Entered Segment. Should Send Payload", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "user_entered_segment" });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("http://fake-url.io");

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
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "user_left_segment" });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("http://fake-url.io");

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
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "user_attribute_updated" });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("http://fake-url.io");

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
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "user_event" });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("http://fake-url.io");

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
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {

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
          const scope = nock("http://fake-url.io");

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
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "user_account_attribute_updated");

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("http://fake-url.io");

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
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {

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
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "user_entered_segment", negative: true });

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
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "user_left_segment", negative: true });

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
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {

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

  it("Not Whitelisted User Event Occurred. Should Send Payload", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "user_event", negative: true });

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
