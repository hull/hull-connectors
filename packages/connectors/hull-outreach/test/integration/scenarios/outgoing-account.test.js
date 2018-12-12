// @flow
const _ = require("lodash");

process.env.CLIENT_ID = "clientId";
process.env.CLIENT_SECRET = "clientSecret";

/* global describe, it, beforeEach, afterEach */
const testScenario = require("hull-connector-framework/src/test-scenario");
const connectorServer = require("../../../server/server");


test("send smart-notifier user update to outreach", () => {
  return testScenario({ connectorServer }, ({ handlers, nock, expect }) => {
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
          .reply(200, {"access_token":"5678","token_type":"Bearer","expires_in":6405,"refresh_token":"efgh","scope":"create_prospects prospects.all create_accounts accounts.all webhooks.all","created_at":1544364978});

        scope
          .get("/api/v2/accounts/?filter[domain]=bluth.com")
          .reply(200, require("../fixtures/api-responses/outgoing-account-bluth-lookup.json"));
        scope
          .get("/api/v2/accounts/?filter[domain]=wayneenterprises.com")
          .reply(200, require("../fixtures/api-responses/outgoing-account-wayne-lookup.json"));

        //  , {"data":{"type":"account","id":28,"attributes":{"domain":"wayneenterprises.com","custom1":"Manufacturing","name":"Wayne Enterprises (Sample Lead)"}}}
        scope
          .intercept('/api/v2/accounts/28', 'PATCH')
          .reply(200, require("../fixtures/api-responses/outgoing-account-wayne-patch.json"));

        // , {"data":{"type":"account","id":29,"attributes":{"domain":"bluth.com","custom1":"Real estate","name":"Bluth Company (Sample Lead)","locality":"RI"}}}
        scope
          .intercept('/api/v2/accounts/29', 'PATCH')
          .reply(200, require("../fixtures/api-responses/outgoing-account-bluth-patch.json"));

        return scope;
      },
      response: {
        flow_control: {
          type: "next",
          in: 5,
          in_time: 10,
          size: 10,
        }
      },
      logs: [
        ["info", "outgoing.account.skip", {"account_domain": "close.io", "account_id": "5bd329d4e2bcf3eeaf000071", "request_id": expect.whatever(), "subject_type": "account"}, {"reason": "No changes on any of the synchronized attributes for this account.  If you think this is a mistake, please check the settings page for the synchronized account attributes to ensure that the attribute which changed is in the synchronized outgoing attributes"}],
        ["info", "outgoing.account.skip", {"account_external_id": "Oct242018_338ExternalId", "account_id": "5bd36d8de3d21792360001fd", "request_id": expect.whatever(), "subject_type": "account"}, {"reason": "Account is not present in any existing segment (account_segments).  Please add the account to an existing synchronized segment"}],
        ["debug", "connector.service_api.call", {"request_id": expect.whatever()}, {"method": "GET", "responseTime": expect.whatever(), "status": 401, "url": "/accounts/", "vars": {}}],
        ["debug", "connector.service_api.call", {"request_id": expect.whatever()}, {"method": "GET", "responseTime": expect.whatever(), "status": 401, "url": "/accounts/", "vars": {}}],
        ["debug", "connector.service_api.call", {"request_id": expect.whatever()}, {"method": "POST", "responseTime": expect.whatever(), "status": 200, "url": "https://api.outreach.io/oauth/token", "vars": {}}],
        ["debug", "connector.service_api.call", {"request_id": expect.whatever()}, {"method": "GET", "responseTime": expect.whatever(), "status": 200, "url": "/accounts/", "vars": {}}],
        ["debug", "connector.service_api.call", {"request_id": expect.whatever()}, {"method": "GET", "responseTime": expect.whatever(), "status": 200, "url": "/accounts/", "vars": {}}],
        ["debug", "connector.service_api.call", {"request_id": expect.whatever()}, {"method": "PATCH", "responseTime": expect.whatever(), "status": 200, "url": "/accounts/28", "vars": {}}],
        ["debug", "connector.service_api.call", {"request_id": expect.whatever()}, {"method": "PATCH", "responseTime": expect.whatever(), "status": 200, "url": "/accounts/29", "vars": {}}],
        ["info", "outgoing.account.success", {"account_domain": "wayneenterprises.com", "account_id": "5bf2e7bf064aee16a600092a", "request_id": expect.whatever(), "subject_type": "account"}, {"data": {"data": {"attributes": {"custom1": "Manufacturing", "domain": "wayneenterprises.com", "name": "Wayne Enterprises (Sample Lead)"}, "id": 28, "type": "account"}}, "operation": "patch", "response": {"attributes": {"companyType": null, "createdAt": "2018-11-15T21:25:00.000Z", "custom1": "Manufacturing", "custom10": null, "custom11": null, "custom12": null, "custom13": null, "custom14": null, "custom15": null, "custom16": null, "custom17": null, "custom18": null, "custom19": null, "custom2": "175 4th st nw", "custom20": null, "custom21": null, "custom22": null, "custom23": null, "custom24": null, "custom25": null, "custom26": null, "custom27": null, "custom28": null, "custom29": null, "custom3": null, "custom30": null, "custom31": null, "custom32": null, "custom33": null, "custom34": null, "custom35": null, "custom4": null, "custom5": null, "custom6": null, "custom7": null, "custom8": null, "custom9": null, "customId": null, "description": null, "domain": "wayneenterprises.com", "externalSource": "outreach-api", "followers": null, "foundedAt": null, "industry": null, "linkedInEmployees": null, "linkedInUrl": null, "locality": null, "name": "Wayne Enterprises (Sample Lead)", "named": true, "naturalName": null, "numberOfEmployees": null, "tags": [], "updatedAt": "2018-12-09T14:29:36.000Z", "websiteUrl": null}, "id": 28, "links": {"self": "https://api.outreach.io/api/v2/accounts/28"}, "relationships": {"creator": {"data": {"id": 1, "type": "user"}}, "owner": {"data": null}, "prospects": {"links": {"related": "https://api.outreach.io/api/v2/prospects?filter%5Baccount%5D%5Bid%5D=28"}}, "tasks": {"links": {"related": "https://api.outreach.io/api/v2/tasks?filter%5Baccount%5D%5Bid%5D=28"}}, "updater": {"data": {"id": 1, "type": "user"}}}, "type": "account"}, "type": "Account"}],
        ["info", "outgoing.account.success", {"account_domain": "bluth.com", "account_id": "5bf2e7bf064aee16a600092d", "request_id": expect.whatever(), "subject_type": "account"}, {"data": {"data": {"attributes": {"custom1": "Real estate", "domain": "bluth.com", "locality": "RI", "name": "Bluth Company (Sample Lead)"}, "id": 29, "type": "account"}}, "operation": "patch", "response": {"attributes": {"companyType": null, "createdAt": "2018-11-15T21:25:00.000Z", "custom1": "Real estate", "custom10": null, "custom11": null, "custom12": null, "custom13": null, "custom14": null, "custom15": null, "custom16": null, "custom17": null, "custom18": null, "custom19": null, "custom2": "100 Bluth Drive", "custom20": null, "custom21": null, "custom22": null, "custom23": null, "custom24": null, "custom25": null, "custom26": null, "custom27": null, "custom28": null, "custom29": null, "custom3": null, "custom30": null, "custom31": null, "custom32": null, "custom33": null, "custom34": null, "custom35": null, "custom4": null, "custom5": null, "custom6": null, "custom7": null, "custom8": null, "custom9": null, "customId": null, "description": null, "domain": "bluth.com", "externalSource": "outreach-api", "followers": null, "foundedAt": null, "industry": null, "linkedInEmployees": null, "linkedInUrl": null, "locality": "RI", "name": "Bluth Company (Sample Lead)", "named": true, "naturalName": null, "numberOfEmployees": null, "tags": [], "updatedAt": "2018-12-09T14:29:36.000Z", "websiteUrl": null}, "id": 29, "links": {"self": "https://api.outreach.io/api/v2/accounts/29"}, "relationships": {"creator": {"data": {"id": 1, "type": "user"}}, "owner": {"data": null}, "prospects": {"links": {"related": "https://api.outreach.io/api/v2/prospects?filter%5Baccount%5D%5Bid%5D=29"}}, "tasks": {"links": {"related": "https://api.outreach.io/api/v2/tasks?filter%5Baccount%5D%5Bid%5D=29"}}, "updater": {"data": {"id": 1, "type": "user"}}}, "type": "account"}, "type": "Account"}],
        ["info", "incoming.account.success", {"request_id": expect.whatever()}, {"data": {"attributes": {"outreach/id": {"operation": "set", "value": 28}}, "ident": {"anonymous_id": "outreach:28", "domain": "wayneenterprises.com"}}}],
        ["info", "incoming.account.success", {"request_id": expect.whatever()}, {"data": {"attributes": {"outreach/id": {"operation": "set", "value": 29}}, "ident": {"anonymous_id": "outreach:29", "domain": "bluth.com"}}}]],
      firehoseEvents: [
        ["traits", {"asAccount": {"anonymous_id": "outreach:28", "domain": "wayneenterprises.com"}, "subjectType": "account"}, {"outreach/id": {"operation": "set", "value": 28}}],
        ["traits", {"asAccount": {"anonymous_id": "outreach:29", "domain": "bluth.com"}, "subjectType": "account"}, {"outreach/id": {"operation": "set", "value": 29}}]
      ],
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
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.outgoing.accounts", 1],
        ["increment", "ship.outgoing.accounts", 1],
        ["increment", "ship.incoming.accounts", 1],
        ["increment", "ship.incoming.accounts", 1]
      ],
      platformApiCalls: [
        ["GET", "/api/v1/app", {}, {}],
        ["PUT", "/api/v1/123456789012345678901234", {}, {"private_settings": {"access_token": "5678", "created_at": 1544364978, "expires_in": 6405, "incoming_account_attributes": [{"hull": "outreach/company_type", "service": "companyType"}, {"hull": "outreach/description", "service": "description"}], "account_claims": [{"hull": "domain", "service": "domain"}, {"hull": "external_id", "service": "customId"}], "incoming_user_attributes": [{"hull": "traits_outreach/custom1", "service": "custom1"}, {"hull": "traits_outreach/custom2", "service": "custom2"}, {"hull": "traits_outreach/personalnote2", "service": "personalNote1"}], "outgoing_account_attributes": [{"hull": "closeio/industry_sample", "service": "custom1"}, {"hull": "closeio/name", "service": "name"}, {"hull": "closeio/address_business_state", "service": "locality"}], "outgoing_user_attributes": [{"hull": "traits_closeio/title", "service": "title"}, {"hull": "traits_closeio/phone_office", "service": "workPhones"}], "refresh_token": "efgh", "synchronized_account_segments": ["5bd7201aa682bc4a4d00001e"], "synchronized_user_segments": ["5bffc38f625718d58b000004"], "token_created_at": 1544104207, "token_expires_in": 7200, "webhook_id": 31}}]
      ]
    });
  });
});
