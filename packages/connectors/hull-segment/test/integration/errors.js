// @flow
import { encrypt } from "hull/src/utils/crypto";
import connectorConfig from "../../server/config";
import { trackPayload } from "../fixtures";

const testScenario = require("hull-connector-framework/src/test-scenario");

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
