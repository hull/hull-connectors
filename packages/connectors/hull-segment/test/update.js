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

const xit = () => {};
describe("Send Payloads", () => {
  xit("send update message to batch endpoint", () =>
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
            handle_accounts: true
          },
          private_settings: {
            synchronized_properties: ["created_at"],
            synchronized_segments: ["5ade25df4d257947aa001cd5"]
          }
        },
        // nock the segment endpoint that we send to..
        externalApiMock: () =>
          nock("https://api.segment.io")
            .post("/v1/batch", body => {
              console.log("NOCK", body);
              return (
                body.batch.length === 1 &&
                body.batch[0].type === "identify" &&
                body.batch[0].anonymousId === "outreach:16" &&
                _.isEqual(body.batch[0].traits, {
                  hull_segments: [],
                  created_at: "2018-10-26T14:51:01Z"
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
              reason: "no changes to emit",
              traits: expect.whatever()
            }
          ],
          [
            "debug",
            "outgoing.event.skip",
            expect.whatever(),
            {
              reason: "not included in event list",
              event: "page"
            }
          ],
          [
            "debug",
            "outgoing.account.skip",
            expect.whatever(),
            {
              reason: "no changes to emit",
              traits: expect.whatever()
            }
          ]
        ],
        metrics: [METRIC_CONNECTOR_REQUEST],
        firehoseEvents: [],
        platformApiCalls: []
      })
    ));
});
