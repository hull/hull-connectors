// @flow

import testScenario from "hull-connector-framework/src/test-scenario";
import _ from "lodash";
import { encrypt } from "hull/src/utils/crypto";
import supertest from "supertest";
import connectorConfig from "../../../server/config";
import TESTS from "../../tests";

const shipID = "9993743b22d60dd829001999";
const config = {
  organization: "localhost:8001",
  ship: shipID,
  secret: "1234"
};

process.env.MONGO_URL = "mongodb://localhost/incoming-webhook-test-db";
process.env.MONGO_COLLECTION_NAME = "incoming-webhooks-tests";

TESTS.map(function performTest({
  title,
  body,
  code,
  logs,
  metrics,
  platformApiCalls,
  firehoseEvents
}) {
  it(title, async () =>
    testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      handlerType: handlers.incomingRequestHandler,
      externalApiMock: () => {},
      externalIncomingRequest: async ({
        superagent,
        connectorUrl,
        config,
        plainCredentials
      }) => {
        const token = encrypt(plainCredentials, config.hostSecret);
        try {
          return await superagent
            .post(`${connectorUrl}/webhooks/9993743b22d60dd829001999/${token}`)
            .send(body);
        } catch (err) {
          console.log(err);
          throw err;
        }
      },
      connector: {
        private_settings: {
          code
        }
      },
      usersSegments: [],
      accountsSegments: [],
      response: {
        ok: true
      },
      logs,
      metrics,
      firehoseEvents,
      platformApiCalls
    }))
  );
});

it("Should return 400 on Invalid Json", () =>
  testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
    handlerType: handlers.incomingRequestHandler,
    externalApiMock: () => {},
    externalIncomingRequest: async ({
      superagent,
      connectorUrl,
      config,
      plainCredentials
    }) => {
      const token = encrypt(plainCredentials, config.hostSecret);
      const response = await supertest(connectorUrl)
        .post(`/webhooks/9993743b22d60dd829001999/${token}`)
        .send('{"userfoo"}')
        .type("json");
      return response;
    },
    connector: { private_settings: { code: "" } },
    usersSegments: [],
    accountsSegments: [],
    responseStatusCode: 400,
    response: {
      message: "Unexpected token } in JSON at position 10"
    },
    logs: [],
    metrics: [],
    firehoseEvents: [],
    platformApiCalls: []
  })));
