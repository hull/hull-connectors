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
} = require("../fixtures");

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

const eventFromTrack = (expect, event) => [
  "track",
  {
    asUser: { anonymous_id: event.anonymous_id, external_id: event.user_id },
    subjectType: "user"
  },
  {
    _bid: event.anonymous_id,
    _sid: expect.whatever(),
    created_at: event.timestamp,
    event: event.event,
    event_id: expect.whatever(),
    ip: "1234",
    latitude: event.context?.location?.latitude,
    longitude: event.context?.location?.longitude,
    properties: event.properties,
    referer: event.context.page.referrer,
    referrer: event.context.page.referrer,
    source: "segment",
    url: event.context.page.url
  }
];

const eventFromPage = (expect, event) => [
  "track",
  { asUser: { external_id: event.user_id }, subjectType: "user" },
  {
    _bid: event.user_id,
    _sid: expect.whatever(),
    active: true,
    ip: "0",
    properties: event.properties,
    referer: event.context.page.referrer,
    referrer: event.context.page.referrer,
    source: "segment",
    url: event.context.page.url,
    created_at: event.timestamp,
    event: event.type,
    event_id: event.message_id
  }
];

const eventFromScreen = (expect, event) => [
  "track",
  { asUser: { external_id: event.user_id }, subjectType: "user" },
  {
    _bid: event.user_id,
    _sid: expect.whatever(),
    active: true,
    ip: "0",
    properties: event.properties,
    source: "segment",
    referer: null,
    url: null,
    created_at: event.timestamp,
    event: event.type,
    event_id: event.message_id
  }
];

const eventFromIdentify = (expect, event) => [
  "traits",
  {
    asUser: { email: event.traits.email, external_id: event.user_id },
    subjectType: "user"
  },
  event.traits
];

describe("Error Payloads", () => {
  it("Should return 401 on missing credentials", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.incomingRequestHandler,
        connector: {},
        externalApiMock: () => {},
        externalIncomingRequest: async ({
          superagent,
          connectorUrl,
          config,
          plainCredentials
        }) =>
          await supertest(connectorUrl)
            .post("/segment")
            .query({})
            .send(track)
            .type("json"),
        responseStatusCode: 401,
        response: {
          message: "id property in Configuration is invalid: "
        },
        usersSegments: [],
        accountsSegments: [],
        logs: [],
        metrics: [],
        firehoseEvents: [],
        platformApiCalls: []
      })
    ));

  it("Should return error 400 on Invalid Body", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.incomingRequestHandler,
        connector: {},
        externalApiMock: () => {},
        externalIncomingRequest: async ({
          superagent,
          connectorUrl,
          config,
          plainCredentials
        }) =>
          await supertest(connectorUrl)
            .post(`/segment`)
            .send("{boom")
            .type("json"),
        responseStatusCode: 400,
        response: {
          message: "Unexpected token b in JSON at position 1"
        },
        usersSegments: [],
        accountsSegments: [],
        logs: [],
        metrics: [],
        firehoseEvents: [],
        platformApiCalls: []
      })
    ));

  it("should return Invalid token with a token signed with an invalid signature", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.incomingRequestHandler,
        connector: {
          id: CONNECTOR_ID,
          settings: {},
          private_settings: {}
        },
        externalApiMock: () => {},
        externalIncomingRequest: async ({
          superagent,
          connectorUrl,
          config,
          plainCredentials
        }) => {
          const token = jwt.encode(
            plainCredentials,
            `${config.hostSecret}invalid`
          );
          return await supertest(connectorUrl)
            .post("/segment")
            .set({
              authorization: `Basic ${Buffer.from(token).toString("base64")}`
            })
            .send(track)
            .type("json");
        },
        responseStatusCode: 401,
        response: { message: "Invalid Token" },
        usersSegments: [],
        accountsSegments: [],
        logs: [],
        metrics: [],
        firehoseEvents: [],
        platformApiCalls: []
      })
    ));
  it("should return Missing credentials with a token with missing connector ID", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.incomingRequestHandler,
        connector: {
          id: CONNECTOR_ID,
          settings: {},
          private_settings: {}
        },
        externalApiMock: () => {},
        externalIncomingRequest: async ({
          superagent,
          connectorUrl,
          config,
          plainCredentials
        }) => {
          const token = jwt.encode(
            {
              secret: plainCredentials.secret,
              organization: "abc.boom"
            },
            config.hostSecret
          );
          return await supertest(connectorUrl)
            .post("/segment")
            .set({
              authorization: `Basic ${Buffer.from(` ${token} `).toString(
                "base64"
              )}`
            })
            .send(track)
            .type("json");
        },
        responseStatusCode: 401,
        response: { message: "Configuration is missing required property: id" },
        usersSegments: [],
        accountsSegments: [],
        logs: [],
        metrics: [],
        firehoseEvents: [],
        platformApiCalls: []
      })
    ));
  it("should return Missing credentials with a token with invalid connector ID", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.incomingRequestHandler,
        connector: {
          id: CONNECTOR_ID,
          settings: {},
          private_settings: {}
        },
        externalApiMock: () => {},
        externalIncomingRequest: async ({
          superagent,
          connectorUrl,
          config,
          plainCredentials
        }) => {
          const token = jwt.encode(
            {
              ...plainCredentials,
              ship: "not_found"
            },
            config.hostSecret
          );
          return await supertest(connectorUrl)
            .post("/segment")
            .set({
              authorization: `Basic ${Buffer.from(` ${token} `).toString(
                "base64"
              )}`
            })
            .send(track)
            .type("json");
        },
        responseStatusCode: 401,
        response: {
          message: "id property in Configuration is invalid: not_found"
        },
        usersSegments: [],
        accountsSegments: [],
        logs: [],
        metrics: [],
        firehoseEvents: [],
        platformApiCalls: []
      })
    ));
  it("should return error if body type not supported", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.incomingRequestHandler,
        connector: {
          id: CONNECTOR_ID,
          settings: {},
          private_settings: {}
        },
        externalApiMock: () => {},
        externalIncomingRequest: async ({
          superagent,
          connectorUrl,
          config,
          plainCredentials
        }) => {
          const token = jwt.encode(plainCredentials, config.hostSecret);
          return await supertest(connectorUrl)
            .post("/segment")
            .set({
              authorization: `Basic ${Buffer.from(` ${token} `).toString(
                "base64"
              )}`
            })
            .send({ type: "bogus" })
            .type("json");
        },
        responseStatusCode: 501,
        responseText: "Not Supported",
        usersSegments: [],
        accountsSegments: [],
        logs: [
          ["debug", "incoming.bogus.start", {}, { type: "bogus" }],
          [
            "error",
            "incoming.bogus.error",
            {},
            {
              body: { type: "bogus" },
              headers: expect.whatever(),
              method: "POST",
              params: {},
              status: 501,
              url: "/segment"
            }
          ]
        ],
        metrics: [
          ["increment", "connector.request", 1],
          ["increment", "request.bogus", 1]
        ],
        firehoseEvents: [],
        platformApiCalls: [
          PLATFORM_APP_CALL,
          PLATFORM_USER_SEGMENTS,
          PLATFORM_ACCOUNT_SEGMENTS
        ]
      })
    ));
});

describe("With credentials - direct style", () => {
  it("With credentials - webhook style", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.incomingRequestHandler,
        connector: {
          id: CONNECTOR_ID,
          settings: {},
          private_settings: {}
        },
        externalApiMock: () => {},
        externalIncomingRequest: async ({
          superagent,
          connectorUrl,
          config,
          plainCredentials
        }) =>
          await supertest(connectorUrl)
            .post("/segment")
            .query(plainCredentials)
            .send(track)
            .type("json"),
        responseStatusCode: 200,
        responseText: "thanks",
        usersSegments: [],
        accountsSegments: [],
        logs: [["debug", "incoming.track.start", {}, track]],
        metrics: [METRIC_CONNECTOR_REQUEST, METRIC_REQUEST_TRACK],
        firehoseEvents: [eventFromTrack(expect, track)],
        platformApiCalls: [
          PLATFORM_APP_CALL,
          PLATFORM_USER_SEGMENTS,
          PLATFORM_ACCOUNT_SEGMENTS
        ]
      })
    ));
  it("With credentials - direct style", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.incomingRequestHandler,
        connector: {
          id: CONNECTOR_ID,
          settings: {},
          private_settings: {}
        },
        externalApiMock: () => {},
        externalIncomingRequest: async ({
          superagent,
          connectorUrl,
          config,
          plainCredentials
        }) => {
          const token = jwt.encode(plainCredentials, config.hostSecret);
          return await supertest(connectorUrl)
            .post("/segment")
            .set({
              authorization: `Basic ${Buffer.from(token).toString("base64")}`
            })
            .send(track)
            .type("json");
        },
        responseStatusCode: 200,
        responseText: "thanks",
        usersSegments: [],
        accountsSegments: [],
        logs: [["debug", "incoming.track.start", {}, track]],
        metrics: [METRIC_CONNECTOR_REQUEST, METRIC_REQUEST_TRACK],
        firehoseEvents: [eventFromTrack(expect, track)],
        platformApiCalls: [
          PLATFORM_APP_CALL,
          PLATFORM_USER_SEGMENTS,
          PLATFORM_ACCOUNT_SEGMENTS
        ]
      })
    ));
  it("should trim the token when passed with extra spaces", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.incomingRequestHandler,
        connector: {
          id: CONNECTOR_ID,
          settings: {},
          private_settings: {}
        },
        externalApiMock: () => {},
        externalIncomingRequest: async ({
          superagent,
          connectorUrl,
          config,
          plainCredentials
        }) => {
          const token = jwt.encode(plainCredentials, config.hostSecret);
          return await supertest(connectorUrl)
            .post("/segment")
            .set({
              authorization: `Basic ${Buffer.from(` ${token} `).toString(
                "base64"
              )}`
            })
            .send(track)
            .type("json");
        },
        responseStatusCode: 200,
        responseText: "thanks",
        usersSegments: [],
        accountsSegments: [],
        logs: [["debug", "incoming.track.start", {}, track]],
        metrics: [METRIC_CONNECTOR_REQUEST, METRIC_REQUEST_TRACK],
        firehoseEvents: [eventFromTrack(expect, track)],
        platformApiCalls: [
          PLATFORM_APP_CALL,
          PLATFORM_USER_SEGMENTS,
          PLATFORM_ACCOUNT_SEGMENTS
        ]
      })
    ));
  it("call Hull.track on track event", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.incomingRequestHandler,
        connector: {
          id: CONNECTOR_ID,
          settings: {},
          private_settings: {}
        },
        externalApiMock: () => {},
        externalIncomingRequest: async ({
          superagent,
          connectorUrl,
          config,
          plainCredentials
        }) => {
          const token = jwt.encode(plainCredentials, config.hostSecret);
          return await supertest(connectorUrl)
            .post("/segment")
            .set({
              authorization: `Basic ${Buffer.from(` ${token} `).toString(
                "base64"
              )}`
            })
            .send(track)
            .type("json");
        },
        responseStatusCode: 200,
        responseText: "thanks",
        usersSegments: [],
        accountsSegments: [],
        logs: [["debug", "incoming.track.start", {}, track]],
        metrics: [METRIC_CONNECTOR_REQUEST, METRIC_REQUEST_TRACK],
        firehoseEvents: [eventFromTrack(expect, track)],
        platformApiCalls: [
          PLATFORM_APP_CALL,
          PLATFORM_USER_SEGMENTS,
          PLATFORM_ACCOUNT_SEGMENTS
        ]
      })
    ));
  it("call Hull.track on page event", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.incomingRequestHandler,
        connector: {
          id: CONNECTOR_ID,
          settings: {},
          private_settings: {}
        },
        externalApiMock: () => {},
        externalIncomingRequest: async ({
          superagent,
          connectorUrl,
          config,
          plainCredentials
        }) => {
          const token = jwt.encode(plainCredentials, config.hostSecret);
          return await supertest(connectorUrl)
            .post("/segment")
            .set({
              authorization: `Basic ${Buffer.from(` ${token} `).toString(
                "base64"
              )}`
            })
            .send(page)
            .type("json");
        },
        responseStatusCode: 200,
        responseText: "thanks",
        usersSegments: [],
        accountsSegments: [],
        logs: [["debug", "incoming.page.start", {}, expect.whatever()]],
        metrics: [METRIC_CONNECTOR_REQUEST, METRIC_REQUEST_PAGE],
        firehoseEvents: [eventFromPage(expect, page)],
        platformApiCalls: [
          PLATFORM_APP_CALL,
          PLATFORM_USER_SEGMENTS,
          PLATFORM_ACCOUNT_SEGMENTS
        ]
      })
    ));
  it("call Hull.track on screen event", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.incomingRequestHandler,
        connector: {
          id: CONNECTOR_ID,
          settings: {},
          private_settings: {}
        },
        externalApiMock: () => {},
        externalIncomingRequest: async ({
          superagent,
          connectorUrl,
          config,
          plainCredentials
        }) => {
          const token = jwt.encode(plainCredentials, config.hostSecret);
          return await supertest(connectorUrl)
            .post("/segment")
            .set({
              authorization: `Basic ${Buffer.from(` ${token} `).toString(
                "base64"
              )}`
            })
            .send(screen)
            .type("json");
        },
        responseStatusCode: 200,
        responseText: "thanks",
        usersSegments: [],
        accountsSegments: [],
        logs: [["debug", "incoming.screen.start", {}, expect.whatever()]],
        metrics: [METRIC_CONNECTOR_REQUEST, METRIC_REQUEST_SCREEN],
        firehoseEvents: [eventFromScreen(expect, screen)],
        platformApiCalls: [
          PLATFORM_APP_CALL,
          PLATFORM_USER_SEGMENTS,
          PLATFORM_ACCOUNT_SEGMENTS
        ]
      })
    ));
  it("call Hull.track on identify event", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.incomingRequestHandler,
        connector: {
          id: CONNECTOR_ID,
          settings: {},
          private_settings: {}
        },
        externalApiMock: () => {},
        externalIncomingRequest: async ({
          superagent,
          connectorUrl,
          config,
          plainCredentials
        }) => {
          const token = jwt.encode(plainCredentials, config.hostSecret);
          return await supertest(connectorUrl)
            .post("/segment")
            .set({
              authorization: `Basic ${Buffer.from(` ${token} `).toString(
                "base64"
              )}`
            })
            .send(identify)
            .type("json");
        },
        responseStatusCode: 200,
        responseText: "thanks",
        usersSegments: [],
        accountsSegments: [],
        logs: [
          ["debug", "incoming.identify.start", {}, expect.whatever()],
          [
            "debug",
            "incoming.user.success",
            expect.whatever(),
            expect.whatever()
          ]
        ],
        metrics: [
          METRIC_CONNECTOR_REQUEST,
          METRIC_REQUEST_IDENTIFY,
          ["increment", "request.identify.updateUser", 1]
        ],
        firehoseEvents: [eventFromIdentify(expect, identify)],
        platformApiCalls: [
          PLATFORM_APP_CALL,
          PLATFORM_USER_SEGMENTS,
          PLATFORM_ACCOUNT_SEGMENTS
        ]
      })
    ));
  it("Ignores incoming userId if settings.ignore_segment_userId is true", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.incomingRequestHandler,
        connector: {
          id: CONNECTOR_ID,
          settings: {
            ignore_segment_userId: true
          },
          private_settings: {
            foo: "Bar"
          }
        },
        externalApiMock: () => {},
        externalIncomingRequest: async ({
          superagent,
          connectorUrl,
          config,
          plainCredentials
        }) => {
          const token = jwt.encode(plainCredentials, config.hostSecret);
          return await supertest(connectorUrl)
            .post("/segment")
            .set({
              authorization: `Basic ${Buffer.from(` ${token} `).toString(
                "base64"
              )}`
            })
            .send(identify)
            .type("json");
        },
        responseStatusCode: 200,
        responseText: "thanks",
        usersSegments: [],
        accountsSegments: [],
        logs: [
          [
            "debug",
            "incoming.identify.start",
            expect.whatever(),
            expect.whatever()
          ],
          [
            "debug",
            "incoming.user.success",
            expect.whatever(),
            expect.whatever()
          ]
        ],
        metrics: [
          METRIC_CONNECTOR_REQUEST,
          METRIC_REQUEST_IDENTIFY,
          ["increment", "request.identify.updateUser", 1]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              asUser: {
                email: identify.traits.email
              },
              subjectType: "user"
            },
            expect.whatever()
          ]
        ],
        platformApiCalls: [
          PLATFORM_APP_CALL,
          PLATFORM_USER_SEGMENTS,
          PLATFORM_ACCOUNT_SEGMENTS
        ]
      })
    ));
  it("Skip if settings.ignore_segment_userId is true and we have no email", () =>
    testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => ({
        handlerType: handlers.incomingRequestHandler,
        connector: {
          id: CONNECTOR_ID,
          settings: {
            ignore_segment_userId: true
          },
          private_settings: {
            foo: "Bar"
          }
        },
        externalApiMock: () => {},
        externalIncomingRequest: async ({
          superagent,
          connectorUrl,
          config,
          plainCredentials
        }) => {
          const token = jwt.encode(plainCredentials, config.hostSecret);
          return await supertest(connectorUrl)
            .post("/segment")
            .set({
              authorization: `Basic ${Buffer.from(` ${token} `).toString(
                "base64"
              )}`
            })
            .send({ ...identify, traits: { first_name: "Bob" } })
            .type("json");
        },
        responseStatusCode: 200,
        responseText: "thanks",
        usersSegments: [],
        accountsSegments: [],
        logs: [
          [
            "debug",
            "incoming.identify.start",
            expect.whatever(),
            expect.whatever()
          ],
          ["debug", "incoming.user.skip", expect.whatever(), expect.whatever()]
        ],
        metrics: [METRIC_CONNECTOR_REQUEST, METRIC_REQUEST_IDENTIFY],
        firehoseEvents: [],
        platformApiCalls: [
          PLATFORM_APP_CALL,
          PLATFORM_USER_SEGMENTS,
          PLATFORM_ACCOUNT_SEGMENTS
        ]
      })
    ));
});
