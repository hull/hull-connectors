// @flow
import { encrypt } from "hull/src/utils/crypto";
import connectorConfig from "../../server/config";
import { trackPayload } from "../fixtures";

const testScenario = require("hull-connector-framework/src/test-scenario");

//Error Test cases
it("Should return 401 on Invalid Token", () =>
  testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
    handlerType: handlers.incomingRequestHandler,
    externalApiMock: () => {},
    externalIncomingRequest: async ({
      superagent,
      connectorUrl,
      config,
      plainCredentials
    }) => {
      try {
        const response = await superagent
          .post(`${connectorUrl}/segment`)
          .set({ Authorization: "Basic SU5WQUxJRA==" })
          .send({ foo: "bar" })
          .type("json");
        return response;
      } catch (err) {
        return err.response;
      }
    },
    connector: {},
    usersSegments: [],
    accountsSegments: [],
    responseStatusCode: 401,
    response: { error: "Invalid Token", message: "Invalid Token" },
    logs: [],
    metrics: [],
    firehoseEvents: [],
    platformApiCalls: []
  })));

it("Should return 401 on missing ID in valid token", () =>
  testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
    handlerType: handlers.incomingRequestHandler,
    externalApiMock: () => {},
    externalIncomingRequest: async ({
      superagent,
      connectorUrl,
      config,
      plainCredentials
    }) => {
      const token = encrypt({}, config.hostSecret);
      try {
        const response = await superagent
          .post(`${connectorUrl}/segment`)
          .send(trackPayload)
          .set({
            Authorization: `Basic ${Buffer.from(token).toString("base64")}`
          })
          .type("json");
        return response;
      } catch (err) {
        return err.response;
      }
    },
    connector: {},
    usersSegments: [],
    accountsSegments: [],
    responseStatusCode: 401,
    response: {
      error: "Configuration is missing required property: id",
      message: "Configuration is missing required property: id"
    },
    logs: [],
    metrics: [],
    firehoseEvents: [],
    platformApiCalls: []
  })));

it("Should return 401 on missing secret configuration", () =>
  testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
    handlerType: handlers.incomingRequestHandler,
    externalApiMock: () => {},
    externalIncomingRequest: async ({
      superagent,
      connectorUrl,
      config,
      plainCredentials
    }) => {
      const incompleteToken = encrypt(
        { ship: "9993743b22d60dd829001990" },
        config.hostSecret
      );
      try {
        const response = await superagent
          .post(`${connectorUrl}/segment`)
          .send(trackPayload)
          .set({
            Authorization: `Basic ${Buffer.from(incompleteToken).toString(
              "base64"
            )}`
          })
          .send({ foo: "bar" })
          .type("json");
        return response;
      } catch (err) {
        return err.response;
      }
    },
    connector: {},
    usersSegments: [],
    accountsSegments: [],
    responseStatusCode: 401,
    response: {
      error: "Configuration is missing required property: secret",
      message: "Configuration is missing required property: secret"
    },
    logs: [],
    metrics: [],
    firehoseEvents: [],
    platformApiCalls: []
  })));

it("Should return 401 on invalid Type", () =>
  testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
    handlerType: handlers.incomingRequestHandler,
    externalApiMock: () => {},
    externalIncomingRequest: async ({
      superagent,
      connectorUrl,
      config,
      plainCredentials
    }) => {
      try {
        const response = await superagent
          .post(`${connectorUrl}/segment`)
          .send({ type: "bogus" })
          .set({
            Authorization: `Basic ${Buffer.from(
              encrypt(plainCredentials, config.hostSecret)
            ).toString("base64")}`
          })
          .type("json");
        return response;
      } catch (err) {
        return err.response;
      }
    },
    connector: { private_settings: {}, settings: {} },
    usersSegments: [],
    accountsSegments: [],
    responseStatusCode: 501,
    response: {
      message: "Not Supported"
    },
    logs: [],
    metrics: [
      ["increment", "connector.request", 1],
      ["increment", "request.error.bogus", 1]
    ],
    firehoseEvents: [],
    platformApiCalls: [
      ["GET", `/api/v1/app`, {}, {}],
      [
        "GET",
        "/api/v1/users_segments?shipId=9993743b22d60dd829001999",
        { shipId: "9993743b22d60dd829001999" },
        {}
      ],
      [
        "GET",
        "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999",
        { shipId: "9993743b22d60dd829001999" },
        {}
      ]
    ]
  })));

// const fakeShipId = "9993743b22d60dd829001990";
// it("Should return 500 on valid token for invalid connector", () =>
//   testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
//     handlerType: handlers.incomingRequestHandler,
//     externalApiMock: () => {},
//     externalIncomingRequest: async ({
//       superagent,
//       connectorUrl,
//       config,
//       plainCredentials
//     }) => {
//       const token = encrypt(
//         {
//           ...plainCredentials,
//           ship: fakeShipId
//         },
//         config.hostSecret
//       );
//       try {
//         const response = await superagent
//           .post(`${connectorUrl}/segment`)
//           .send(trackPayload)
//           .set({
//             Authorization: `Basic ${Buffer.from(token).toString("base64")}`
//           })
//           .send({ foo: "bar" })
//           .type("json");
//         return response;
//       } catch (err) {
//         return err.response;
//       }
//     },
//     connector: {
//     },
//     usersSegments: [],
//     accountsSegments: [],
//     responseStatusCode: 500,
//     response: {},
//     logs: [expect.whatever(), expect.whatever()],
//     metrics: [
//       ["increment", "connector.request", 1],
//       ["increment", "request.track", 1]
//     ],
//     firehoseEvents: [],
//     platformApiCalls: [
//       ["GET", `/api/v1/app`, {}, {}],
//       [
//         "GET",
//         `/api/v1/users_segments?shipId=${fakeShipId}`,
//         { shipId: fakeShipId },
//         {}
//       ],
//       [
//         "GET",
//         `/api/v1/accounts_segments?shipId=${fakeShipId}`,
//         { shipId: fakeShipId },
//         {}
//       ]
//     ]
//   })));
