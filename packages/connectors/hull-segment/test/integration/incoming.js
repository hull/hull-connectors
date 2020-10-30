// @flow

import connectorConfig from "../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");

import TESTS from "../incoming.tests";

// OK Tests
TESTS.map(function performTest({
  title,
  body,
  headers,
  connector,
  response,
  responseStatusCode,
  logs,
  metrics,
  platformApiCalls,
  firehoseEvents
}) {
  return it(title, () =>
    testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      handlerType: handlers.incomingRequestHandler,
      externalApiMock: () => {},
      connector,
      usersSegments: [],
      accountsSegments: [],
      response,
      responseStatusCode,
      logs,
      metrics,
      firehoseEvents,
      platformApiCalls,
      externalIncomingRequest: async ({
        superagent,
        connectorUrl,
        plainCredentials,
        config
      }) => {
        try {
          const response = await superagent
            .post(`${connectorUrl}/segment`)
            .set(headers({ config, plainCredentials }))
            .send(body);
          return response;
        } catch (err) {
          return err.response;
        }
      }
    }))
  );
});
