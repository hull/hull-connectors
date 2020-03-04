/* @flow */
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";
const testScenario = require("hull-connector-framework/src/test-scenario");
const { createSimpleTriggerScenario } = require("hull-webhooks/test/trigger-scenario");
import connectorConfig from "../../server/config";

describe("Outgoing Account Tests", () => {

  it("Account Created. Should Send Payload", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "account_created" });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock("http://fake-url.io");

          scope
            .post("/mock", {
              domain: "apple.com"
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

  it("Account Entered Segment. Should Send Payload", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "account_entered_segment" });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock("http://fake-url.io");

          scope
            .post("/mock", {
              domain: "apple.com"
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

  it("Account Left Segment. Should Send Payload", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "account_left_segment" });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock("http://fake-url.io");

          scope
            .post("/mock", {
              domain: "apple.com"
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

  it("Whitelisted Account Attribute Changed. Should Send Payload", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "account_attribute_updated" });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock("http://fake-url.io");

          scope
            .post("/mock", {
              domain: "apple.com"
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

  // NEGATIVES

  it("Account in whitelisted segment with no other trigger defined. Should Not Send Payload", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "account_synchronized_segment", negative: true });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {},
        response: triggerScenario.getExpectedResponse(),
        logs: triggerScenario.getExpectedLogs(),
        firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
        metrics: triggerScenario.getExpectedMetrics(),
        platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
      });
    });
  });

  it("Account Entered Segment. Should Not Send Payload", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "account_entered_segment", negative: true });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {},
        response: triggerScenario.getExpectedResponse(),
        logs: triggerScenario.getExpectedLogs(),
        firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
        metrics: triggerScenario.getExpectedMetrics(),
        platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
      });
    });
  });

  it("Account Left Segment. Should Not Send Payload", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "account_left_segment", negative: true });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {},
        response: triggerScenario.getExpectedResponse(),
        logs: triggerScenario.getExpectedLogs(),
        firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
        metrics: triggerScenario.getExpectedMetrics(),
        platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
      });
    });
  });

  it("Whitelisted Account Attribute Changed. Should Not Send Payload", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "account_attribute_updated", negative: true });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
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
