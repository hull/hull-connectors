/* @flow */
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";
const testScenario = require("hull-connector-framework/src/test-scenario");
const {
  createSimpleTriggerScenario
} = require("hull-webhooks/test/trigger-scenario");
import connectorConfig from "../../server/config";
import manifest from "../../manifest.json";

const VALID_URL = "http://example.com";
const INVALID_LOCALHOST = "http://localhost";
const INVALID_URL = "http://fake-url.io";

describe("Validate IP Ranges", () => {
  const base_req = ({ expect, ip, hostname, handlers }) => ({
    handlerType: handlers.notificationHandler,
    handlerUrl: "smart-notifier",
    channel: "account:update",
    connector: {
      private_settings: {
        url: `http://${hostname}/mock`
      }
    },
    response: undefined,
    responseText: undefined,
    responseStatusCode: 500,
    logs: [
      [
        "error",
        "outgoing.error",
        expect.whatever(),
        {
          reason: "Forbidden Address",
          addresses: [ip],
          hostname: hostname,
          url: `http://${hostname}/mock`
        }
      ]
    ],
    firehoseEvents: [],
    metrics: [["increment", "connector.request", 1]],
    platformApiCalls: []
  });

  it("Should error out on local IP", () =>
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) =>
      base_req({ ip: "192.168.10.6", hostname: "192.168.10.6", expect, handlers })
    ));
    
  it("Should error out on multicast IP", () =>
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) =>
      base_req({ ip: "224.0.0.0", hostname: "224.0.0.0", expect, handlers })
    ));

  it("Should error out on localhost", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        connector: {
          private_settings: {
            url: `http://localhost/mock`
          }
        },
        response: undefined,
        responseText: undefined,
        responseStatusCode: 500,
        logs: [
          [
            "error",
            "outgoing.error",
            expect.whatever(),
            {
              reason: "queryA ENODATA localhost",
              addresses: undefined,
              hostname: "localhost",
              url: `http://localhost/mock`
            }
          ]
        ],
        firehoseEvents: [],
        metrics: [["increment", "connector.request", 1]],
        platformApiCalls: []
      })
    ));
});

// describe("Outgoing Account Tests", () => {
//   it("Account Created. Should Send Payload", () => {
//     return testScenario(
//       { manifest, connectorConfig },
//       ({ handlers, nock, expect }) => {
//         const triggerScenario = createSimpleTriggerScenario({
//           trigger: "is_new_account"
//         });

//         return _.assign(triggerScenario.getScenarioDefinition(), {
//           handlerType: handlers.notificationHandler,
//           handlerUrl: "smart-notifier",
//           channel: "account:update",
//           externalApiMock: () => {
//             const scope = nock(VALID_URL);

//             scope
//               .post("/mock", {
//                 domain: "apple.com"
//               })
//               .reply(200, {
//                 status: 200
//               });

//             return scope;
//           },
//           response: triggerScenario.getExpectedResponse(),
//           logs: triggerScenario.getExpectedLogs(),
//           firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
//           metrics: triggerScenario.getExpectedMetrics(),
//           platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
//         });
//       }
//     );
//   });

//   it("Account Entered Segment. Should Send Payload", () => {
//     return testScenario(
//       { manifest, connectorConfig },
//       ({ handlers, nock, expect }) => {
//         const triggerScenario = createSimpleTriggerScenario({
//           trigger: "account_segments_entered"
//         });

//         return _.assign(triggerScenario.getScenarioDefinition(), {
//           handlerType: handlers.notificationHandler,
//           handlerUrl: "smart-notifier",
//           channel: "account:update",
//           externalApiMock: () => {
//             const scope = nock(VALID_URL);

//             scope
//               .post("/mock", {
//                 domain: "apple.com"
//               })
//               .reply(200, {
//                 status: 200
//               });

//             return scope;
//           },
//           response: triggerScenario.getExpectedResponse(),
//           logs: triggerScenario.getExpectedLogs(),
//           firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
//           metrics: triggerScenario.getExpectedMetrics(),
//           platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
//         });
//       }
//     );
//   });

//   it("Account Left Segment. Should Send Payload", () => {
//     return testScenario(
//       { manifest, connectorConfig },
//       ({ handlers, nock, expect }) => {
//         const triggerScenario = createSimpleTriggerScenario({
//           trigger: "account_segments_left"
//         });

//         return _.assign(triggerScenario.getScenarioDefinition(), {
//           handlerType: handlers.notificationHandler,
//           handlerUrl: "smart-notifier",
//           channel: "account:update",
//           externalApiMock: () => {
//             const scope = nock(VALID_URL);

//             scope
//               .post("/mock", {
//                 domain: "apple.com"
//               })
//               .reply(200, {
//                 status: 200
//               });

//             return scope;
//           },
//           response: triggerScenario.getExpectedResponse(),
//           logs: triggerScenario.getExpectedLogs(),
//           firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
//           metrics: triggerScenario.getExpectedMetrics(),
//           platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
//         });
//       }
//     );
//   });

//   it("Whitelisted Account Attribute Changed. Should Send Payload", () => {
//     return testScenario(
//       { manifest, connectorConfig },
//       ({ handlers, nock, expect }) => {
//         const triggerScenario = createSimpleTriggerScenario({
//           trigger: "account_attribute_updated"
//         });

//         return _.assign(triggerScenario.getScenarioDefinition(), {
//           handlerType: handlers.notificationHandler,
//           handlerUrl: "smart-notifier",
//           channel: "account:update",
//           externalApiMock: () => {
//             const scope = nock(VALID_URL);

//             scope
//               .post("/mock", {
//                 domain: "apple.com"
//               })
//               .reply(200, {
//                 status: 200
//               });

//             return scope;
//           },
//           response: triggerScenario.getExpectedResponse(),

//           logs: triggerScenario.getExpectedLogs(),
//           firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
//           metrics: triggerScenario.getExpectedMetrics(),
//           platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
//         });
//       }
//     );
//   });

//   // NEGATIVES

//   it("Account in whitelisted segment with no other trigger defined. Should Not Send Payload", () => {
//     return testScenario(
//       { manifest, connectorConfig },
//       ({ handlers, nock, expect }) => {
//         const triggerScenario = createSimpleTriggerScenario({
//           trigger: "account_synchronized_segment",
//           negative: true
//         });

//         return _.assign(triggerScenario.getScenarioDefinition(), {
//           handlerType: handlers.notificationHandler,
//           handlerUrl: "smart-notifier",
//           channel: "account:update",
//           externalApiMock: () => {},
//           response: triggerScenario.getExpectedResponse(),
//           logs: triggerScenario.getExpectedLogs(),
//           firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
//           metrics: triggerScenario.getExpectedMetrics(),
//           platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
//         });
//       }
//     );
//   });

//   it("Account Entered Segment. Should Not Send Payload", () => {
//     return testScenario(
//       { manifest, connectorConfig },
//       ({ handlers, nock, expect }) => {
//         const triggerScenario = createSimpleTriggerScenario({
//           trigger: "account_segments_entered",
//           negative: true
//         });

//         return _.assign(triggerScenario.getScenarioDefinition(), {
//           handlerType: handlers.notificationHandler,
//           handlerUrl: "smart-notifier",
//           channel: "account:update",
//           externalApiMock: () => {},
//           response: triggerScenario.getExpectedResponse(),
//           logs: triggerScenario.getExpectedLogs(),
//           firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
//           metrics: triggerScenario.getExpectedMetrics(),
//           platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
//         });
//       }
//     );
//   });

//   it("Account Left Segment. Should Not Send Payload", () => {
//     return testScenario(
//       { manifest, connectorConfig },
//       ({ handlers, nock, expect }) => {
//         const triggerScenario = createSimpleTriggerScenario({
//           trigger: "account_segments_left",
//           negative: true
//         });

//         return _.assign(triggerScenario.getScenarioDefinition(), {
//           handlerType: handlers.notificationHandler,
//           handlerUrl: "smart-notifier",
//           channel: "account:update",
//           externalApiMock: () => {},
//           response: triggerScenario.getExpectedResponse(),
//           logs: triggerScenario.getExpectedLogs(),
//           firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
//           metrics: triggerScenario.getExpectedMetrics(),
//           platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
//         });
//       }
//     );
//   });

//   it("Whitelisted Account Attribute Changed. Should Not Send Payload", () => {
//     return testScenario(
//       { manifest, connectorConfig },
//       ({ handlers, nock, expect }) => {
//         const triggerScenario = createSimpleTriggerScenario({
//           trigger: "account_attribute_updated",
//           negative: true
//         });

//         return _.assign(triggerScenario.getScenarioDefinition(), {
//           handlerType: handlers.notificationHandler,
//           handlerUrl: "smart-notifier",
//           channel: "account:update",
//           externalApiMock: () => {},
//           response: triggerScenario.getExpectedResponse(),
//           logs: triggerScenario.getExpectedLogs(),
//           firehoseEvents: triggerScenario.getExpectedFirehoseEvents(),
//           metrics: triggerScenario.getExpectedMetrics(),
//           platformApiCalls: triggerScenario.getExpectedPlatformApiCalls()
//         });
//       }
//     );
//   });
// });
