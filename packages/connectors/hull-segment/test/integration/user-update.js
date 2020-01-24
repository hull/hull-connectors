// @flow

import { encrypt } from "hull/src/utils/crypto";
import connectorConfig from "../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");
import TESTS from "../userupdate.tests";

// OK Tests
TESTS.map(function performTest({
  title,
  message,
  body,
  connector,
  response,
  usersSegments,
  accountsSegments,
  responseStatusCode,
  logs,
  metrics,
  platformApiCalls,
  firehoseEvents
}) {
  return it(title, () =>
    testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...message,
      handlerType: handlers.notificationHandler,
      externalApiMock: () => {
        const scope = nock("https://api.segment.io")
          // .log(console.log)
          .post("/v1/batch", body)
          .reply(200, "OK");
      },
      connector,
      usersSegments,
      accountsSegments,
      response,
      responseStatusCode,
      logs,
      metrics,
      firehoseEvents,
      platformApiCalls
    }))
  );
});
