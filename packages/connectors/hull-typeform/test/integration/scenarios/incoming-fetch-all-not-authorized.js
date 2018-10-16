// @flow
const testScenario = require("hull-connector-framework/src/test-scenario");

// workaround to allow connector start
process.env.CLIENT_ID = "123";
const hullTypeformServer = require("../../../server/server");

test("incoming fetch all responses not authorized", () => {
  return testScenario(({ handlers, expect, nock }) => {
    return {
      connectorServer: hullTypeformServer,
      handlerType: handlers.scheduleHandler,
      handlerName: "fetch-all-responses",
      externalApiMock: () => {
        const scope = nock("https://api.typeform.com");
        scope.get("/forms/TYPEFORM1").reply(403);
        return scope;
      },
      connector: { private_settings: { form_id: "TYPEFORM1", field_as_email: "SMEUb7VJz92Q" } },
      usersSegments: [],
      accountsSegments: [],
      response: { response: "ok" },
      logs: [
        ["info", "incoming.job.start", expect.whatever(), expect.whatever()],
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["error", "incoming.job.error", {}, {"error": "Forbidden"}]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "connector.service_api.error", 1]
      ],
      firehoseEvents: []
    };
  });
});
