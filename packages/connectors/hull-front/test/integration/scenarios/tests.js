// @flow

import testScenario from "hull-connector-framework/src/test-scenario";
import _ from "lodash";
import { encrypt } from "hull/src/utils/crypto";
import connectorConfig from "../../../server/config";
import manifest from "../../../manifest.json";
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
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => ({
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
