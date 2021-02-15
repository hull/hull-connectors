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
        externalApiMock: () => {
          nock("http://somefakewebsite.com")
            .get("/getBatchPayload")
            .reply(200, userUpdateEventPayload);

          // Right now the mock batch isn't pulling in the hull_segments

          // nock the segment endpoint that we send to..
          const scope = nock("https://api.segment.io")
            .post("/v1/batch", body => {
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
            .reply(200);

          return scope;
        },
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
  it("Event sent in User Update - Not in Segment", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notify",
        channel: "user:update",
        connector: {
          settings: {
            write_key: "1234"
          },
          private_settings: {
            synchronized_properties: ["created_at"],
            synchronized_segments: ["notarealsegment"]
          }
        },
        externalApiMock: () => {},
        externalIncomingRequest: () => {},
        responseStatusCode: 200,
        response: {
          flow_control: {
            type: "next"
          }
        },
        messages: [{ user: userBatchUpdatePayload, segment_ids: ["a_real_segment"] }],
        usersSegments: [],
        accountsSegments: [],
        logs: [
          ["debug", "outgoing.user.skip", expect.whatever(), {
            reason: "not matching any segment",
            segment_ids: ["a_real_segment"],
            traits: expect.whatever()
          }],
        ],
        metrics: [METRIC_CONNECTOR_REQUEST],
        firehoseEvents: [],
        platformApiCalls: []
      })
    ));
});
