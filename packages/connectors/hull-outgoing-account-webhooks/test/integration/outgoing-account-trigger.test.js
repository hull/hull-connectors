/* @flow */
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";
const testScenario = require("hull-connector-framework/src/test-scenario");
const { createSimpleTriggerScenario } = require("hull-webhooks/test/trigger-scenario");
import connectorConfig from "../../server/config";
import manifest from "../../manifest.json";

const VALID_URL = "http://example.com";
const INVALID_LOCALHOST = "http://localhost";
const INVALID_URL = "http://fake-url.io";

describe("Outgoing Account Tests", () => {

  it("Account Created. Should Send Payload", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "is_new_account" });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock(VALID_URL);

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
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "account_segments_entered" });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock(VALID_URL);

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
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "account_segments_left" });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock(VALID_URL);

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
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "account_attribute_updated" });

      return _.assign(triggerScenario.getScenarioDefinition(), {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock(VALID_URL);

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
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

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
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "account_segments_entered", negative: true });

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
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

      const triggerScenario = createSimpleTriggerScenario({ trigger: "account_segments_left", negative: true });

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
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {

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
