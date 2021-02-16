// @flow

import supertest from "supertest";
import _ from "lodash";
import testScenario from "hull-connector-framework/src/test-scenario";
import connectorConfig from "../server/config";
import manifest from "../manifest.json";
import jwt from "jwt-simple";

const {
  track,
  identify,
  page,
  screen,
  userUpdateEventPayload,
  userBatchUpdateMockMessage,
  userBatchUpdateRaw,
  userBatchUpdatePayload
} = require("./fixtures");

const platformSegmentCall = (type, id) => [
  "GET",
  `/api/v1/${type}_segments?shipId=${id}`,
  {
    shipId: id
  },
  {}
];

process.env.SECRET = "1234";
process.env.REDIS_URL = "redis://localhost:6379";

const CONNECTOR_ID = "999000000000000000000000";

const METRIC_CONNECTOR_REQUEST = ["increment", "connector.request", 1];
const METRIC_REQUEST_TRACK = ["increment", "request.track", 1];
const METRIC_REQUEST_PAGE = ["increment", "request.page", 1];
const METRIC_REQUEST_IDENTIFY = ["increment", "request.identify", 1];
const METRIC_REQUEST_SCREEN = ["increment", "request.screen", 1];
const PLATFORM_APP_CALL = ["GET", "/api/v1/app", {}, {}];
const PLATFORM_USER_SEGMENTS = platformSegmentCall("users", CONNECTOR_ID);
const PLATFORM_ACCOUNT_SEGMENTS = platformSegmentCall("accounts", CONNECTOR_ID);

describe("Send Payloads", () => {
  it("send update message to batch endpoint", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notify",
        channel: "user:update",
        is_export: true,
        connector: {
          settings: {
            write_key: "fakekey",
            handle_accounts: true
          },
          private_settings: {
            synchronized_properties: ["created_at"]
          }
        },
        // nock the segment endpoint that we send to..
        externalApiMock: () =>
          nock("https://api.segment.io")
            .post(
              "/v1/batch",
              body =>
                body.batch.length === 1 &&
                body.batch[0].type === "identify" &&
                body.batch[0].anonymousId === "outreach:16" &&
                _.isEqual(body.batch[0].traits, {
                  hull_segments: [],
                  created_at: "2018-10-26T14:51:01Z"
                })
            )
            .reply(200),
        externalIncomingRequest: () => {},
        responseStatusCode: 200,
        response: {
          flow_control: {
            type: "next"
          }
        },
        messages: [{ user: userBatchUpdatePayload }],
        usersSegments: [],
        accountsSegments: [],
        logs: [
          [
            "info",
            "outgoing.user.success",
            expect.whatever(),
            expect.whatever()
          ],
          [
            "debug",
            "outgoing.account.skip",
            expect.whatever(),
            expect.whatever()
          ]
        ],
        metrics: [METRIC_CONNECTOR_REQUEST],
        firehoseEvents: [],
        platformApiCalls: []
      })
    ));
  it("Should send event but not identify in the case of no attribute changes", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notify",
        channel: "user:update",
        connector: {
          settings: {
            write_key: "1234",
            handle_accounts: false
          },
          private_settings: {
            send_events: ["page"],
            synchronized_properties: ["created_at"],
            synchronized_segments: ["5ade25df4d257947aa001cd5"]
          }
        },
        // nock the segment endpoint that we send to..
        externalApiMock: () =>
          nock("https://api.segment.io")
            .post("/v1/batch", body => {
              const e = userUpdateEventPayload.messages[0].events[0];
              const b = body.batch[0];
              return (
                body.batch.length === 1 &&
                b.type === "page" &&
                b.anonymousId === e.anonymous_id &&
                _.isEqual(b.properties, {
                  url: e.context.page.url,
                  host: e.context.page.host,
                  path: e.context.page.path,
                  referrer: e.context.referrer.url
                })
              );
            })
            .reply(200),
        externalIncomingRequest: () => {},
        responseStatusCode: 200,
        response: {
          flow_control: {
            type: "next"
          }
        },
        messages: [
          {
            ...userUpdateEventPayload.messages[0],
            changes: {
              user: {},
              account: {}
            }
          }
        ],
        usersSegments: [],
        accountsSegments: [],
        logs: [
          [
            "debug",
            "outgoing.user.skip",
            expect.whatever(),
            { reason: "no changes to emit" }
          ],
          [
            "info",
            "outgoing.event.success",
            expect.whatever(),
            { type: "page", track: expect.whatever() }
          ],
          [
            "debug",
            "outgoing.account.skip",
            expect.whatever(),
            { reason: "handle_accounts not enabled" }
          ]
        ],
        metrics: [METRIC_CONNECTOR_REQUEST],
        firehoseEvents: [],
        platformApiCalls: []
      })
    ));
  it("Should send nothing in the case user is not in synchronized segments", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notify",
        channel: "user:update",
        connector: {
          settings: {
            write_key: "1234",
            handle_accounts: false
          },
          private_settings: {
            send_events: ["page"],
            synchronized_properties: ["created_at"],
            synchronized_segments: ["NONE_THAT_MATCH"]
          }
        },
        // nock the segment endpoint that we send to..
        externalApiMock: () => {},
        externalIncomingRequest: () => {},
        responseStatusCode: 200,
        response: {
          flow_control: {
            type: "next"
          }
        },
        messages: [
          {
            ...userUpdateEventPayload.messages[0],
            changes: {
              user: {},
              account: {}
            }
          }
        ],
        usersSegments: [],
        accountsSegments: [],
        logs: [
          [
            "debug",
            "outgoing.user.skip",
            expect.whatever(),
            {
              reason: "not matching any segment",
              data: {
                segment_ids: ["5ade25df4d257947aa001cd5"],
                synchronized_segments: ["NONE_THAT_MATCH"]
              }
            }
          ]
        ],
        metrics: [METRIC_CONNECTOR_REQUEST],
        firehoseEvents: [],
        platformApiCalls: []
      })
    ));
  it("Should send nothing if in ALL segment but no attribute", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notify",
        channel: "user:update",
        connector: {
          settings: {
            write_key: "1234",
            handle_accounts: false
          },
          private_settings: {
            send_events: ["page"],
            synchronized_properties: ["created_at"],
            synchronized_segments: ["ALL"]
          }
        },
        // nock the segment endpoint that we send to..
        externalApiMock: () =>
          nock("https://api.segment.io")
            .post("/v1/batch", body => {
              const e = userUpdateEventPayload.messages[0].events[0];
              const b = body.batch[0];
              return (
                body.batch.length === 1 &&
                b.type === "page" &&
                b.anonymousId === e.anonymous_id &&
                _.isEqual(b.properties, {
                  url: e.context.page.url,
                  host: e.context.page.host,
                  path: e.context.page.path,
                  referrer: e.context.referrer.url
                })
              );
            })
            .reply(200),
        externalIncomingRequest: () => {},
        responseStatusCode: 200,
        response: {
          flow_control: {
            type: "next"
          }
        },
        messages: [
          {
            ...userUpdateEventPayload.messages[0],
            changes: {
              user: {},
              account: {}
            }
          }
        ],
        usersSegments: [],
        accountsSegments: [],
        logs: [
          [
            "debug",
            "outgoing.user.skip",
            expect.whatever(),
            {
              reason: "no changes to emit"
            }
          ],
          [
            "info",
            "outgoing.event.success",
            expect.whatever(),
            {
              track: expect.whatever(),
              type: "page"
            }
          ],
          [
            "debug",
            "outgoing.account.skip",
            expect.whatever(),
            {
              reason: "handle_accounts not enabled"
            }
          ]
        ],
        metrics: [METRIC_CONNECTOR_REQUEST],
        firehoseEvents: [],
        platformApiCalls: []
      })
    ));
  it("Should send a Group call", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notify",
        channel: "user:update",
        connector: {
          settings: {
            write_key: "1234",
            handle_accounts: true
          },
          private_settings: {
            send_events: [],
            synchronized_properties: ["created_at"],
            synchronized_segments: ["5ade25df4d257947aa001cd5"]
          }
        },
        // nock the segment endpoint that we send to..
        externalApiMock: () =>
          nock("https://api.segment.io")
            .post("/v1/batch", body => {
              const b = body.batch[0];
              return (
                body.batch.length === 1 &&
                  b.type === "group" &&
                  b.groupId === "some_id" &&
                  b.anonymousId ===
                    "1537214665-f537a0e8-c475-4f92-921a-d2d441f78d06",
                _.isEqual(b.traits, {
                  domain: "darksideinc.com",
                  hull_segments: ["Account_Segment"]
                })
              );
            })
            .reply(200),
        externalIncomingRequest: () => {},
        responseStatusCode: 200,
        response: {
          flow_control: {
            type: "next"
          }
        },
        messages: [
          {
            ...userUpdateEventPayload.messages[0],
            changes: {
              user: {},
              account: {}
            }
          }
        ],
        usersSegments: [],
        accountsSegments: [],
        logs: [
          [
            "debug",
            "outgoing.user.skip",
            expect.whatever(),
            {
              reason: "no changes to emit"
            }
          ],
          [
            "debug",
            "outgoing.event.skip",
            expect.whatever(),
            {
              event: "page",
              reason: "not included in event list"
            }
          ],
          [
            "info",
            "outgoing.account.success",
            expect.whatever(),
            {
              accountTraits: {
                domain: userUpdateEventPayload.messages[0].account.domain,
                hull_segments: ["Account_Segment"]
              },
              context: expect.whatever(),
              groupId: userUpdateEventPayload.messages[0].account.external_id
            }
          ]
        ],
        metrics: [METRIC_CONNECTOR_REQUEST],
        firehoseEvents: [],
        platformApiCalls: []
      })
    ));
  it("Should send a Identify and Group call if some changes for user Attributes", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notify",
        channel: "user:update",
        connector: {
          settings: {
            write_key: "1234",
            handle_accounts: true
          },
          private_settings: {
            send_events: ["page"],
            synchronized_properties: ["created_at", "last_seen_at"],
            synchronized_segments: ["ALL"]
          }
        },
        // nock the segment endpoint that we send to..
        externalApiMock: () =>
          nock("https://api.segment.io")
            .post("/v1/batch", body => {
              return true;
              const b = body.batch[0];
              return (
                body.batch.length === 1 &&
                  b.type === "group" &&
                  b.groupId === "some_id" &&
                  b.anonymousId ===
                    "1537214665-f537a0e8-c475-4f92-921a-d2d441f78d06",
                _.isEqual(b.traits, {
                  domain: "darksideinc.com",
                  hull_segments: ["Account_Segment"]
                })
              );
            })
            .reply(200),
        externalIncomingRequest: () => {},
        responseStatusCode: 200,
        response: {
          flow_control: {
            type: "next"
          }
        },
        messages: [
          {
            ...userUpdateEventPayload.messages[0],
            events: [],
            changes: {
              user: {
                last_seen_at: ["1", "2"]
              },
              account: {}
            }
          }
        ],
        usersSegments: [],
        accountsSegments: [],
        logs: [
          [
            "info",
            "outgoing.user.success",
            expect.whatever(),
            {
              traits: {
                created_at: expect.whatever(),
                hull_segments: expect.whatever(),
                last_seen_at: expect.whatever()
              },
              userId: undefined
            }
          ],
          [
            "info",
            "outgoing.account.success",
            expect.whatever(),
            {
              accountTraits: {
                domain: userUpdateEventPayload.messages[0].account.domain,
                hull_segments: ["Account_Segment"]
              },
              context: expect.whatever(),
              groupId: userUpdateEventPayload.messages[0].account.external_id
            }
          ]
        ],
        metrics: [METRIC_CONNECTOR_REQUEST],
        firehoseEvents: [],
        platformApiCalls: []
      })
    ));
});
