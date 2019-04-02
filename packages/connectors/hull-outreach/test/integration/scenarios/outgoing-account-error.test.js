// @flow
const _ = require("lodash");

process.env.CLIENT_ID = "clientId";
process.env.CLIENT_SECRET = "clientSecret";








const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";

test("send smart-notifier account update to outreach with authorization error", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    const updateMessages = require("../fixtures/notifier-payloads/outgoing-account-changes.json");
    return _.assign(updateMessages, {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "account:update",
      externalApiMock: () => {
        const scope = nock("https://api.outreach.io");
        scope
          .get("/api/v2/accounts/?filter[domain]=bluth.com")
          .reply(401, require("../fixtures/api-responses/unauthorized-response.json"));
        scope
          .get("/api/v2/accounts/?filter[domain]=wayneenterprises.com")
          .reply(401, require("../fixtures/api-responses/unauthorized-response.json"));

        // , {"refresh_token":"abcd","client_id":"clientId","client_secret":"clientSecret","redirect_uri":,"grant_type":"refresh_token"}
        scope
          .post("/oauth/token")
          .reply(401, require("../fixtures/api-responses/unauthorized-response.json"));

        return scope;
      },
      response: {"error": {"code": "HULL_ERR_CONFIGURATION", "message": "API AccessToken no longer valid, please authenticate with Outreach again using the Credentials button on the settings page", "name": "ConfigurationError"}, "flow_control": {"in": 6000, "in_time": 10, "size": 10, "type": "retry"}},
      logs: [
        ["info", "outgoing.job.start", expect.whatever(), {"jobName": "Outgoing Data", "type": "account"}],
        ["info", "outgoing.account.skip", {"account_domain": "close.io", "account_id": "5bd329d4e2bcf3eeaf000071", "request_id": expect.whatever(), "subject_type": "account"}, {"reason": "No changes on any of the synchronized attributes for this account.  If you think this is a mistake, please check the settings page for the synchronized account attributes to ensure that the attribute which changed is in the synchronized outgoing attributes"}],
        ["info", "outgoing.account.skip", {"account_external_id": "Oct242018_338ExternalId", "account_id": "5bd36d8de3d21792360001fd", "request_id": expect.whatever(), "subject_type": "account"}, {"reason": "Account is not present in any existing segment (account_segments).  Please add the account to an existing synchronized segment"}],
        ["debug", "connector.service_api.call", {"request_id": expect.whatever()}, {"method": "GET", "responseTime": expect.whatever(), "status": 401, "url": "/accounts/", "vars": {}}],
        ["debug", "connector.service_api.call", {"request_id": expect.whatever()}, {"method": "GET", "responseTime": expect.whatever(), "status": 401, "url": "/accounts/", "vars": {}}],
        ["debug", "connector.service_api.call", {"request_id": expect.whatever()}, {"method": "POST", "responseTime": expect.whatever(), "status": 401, "url": "https://api.outreach.io/oauth/token", "vars": {}}],
        ["error", "outgoing.job.error", expect.whatever(), {"error": "API AccessToken no longer valid, please authenticate with Outreach again using the Credentials button on the settings page", "jobName": "Outgoing Data"}]
      ],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "connector.service_api.error", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "connector.service_api.error", 1],
        ["increment", "service.service_api.errors", 1],
        ["increment", "service.service_api.errors", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "connector.service_api.error", 1],
        ["increment", "service.service_api.errors", 1],
        ["increment", "connector.transient_error", 1]],
      platformApiCalls: []
    });
  });
});
