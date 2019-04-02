// @flow
const _ = require("lodash");









process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";

const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";

test("fetch prospects from outreach and page through results from outreach", () => {
  return testScenario({ connectorConfig, debounceWait: 1000 }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.scheduleHandler,
      handlerUrl: "prospectFetchAll",
      configuration: {
        id: "asdf",
        organization: "dev.hullbeta.io",
        secret: "shhhh"
      },
      connector: {
        private_settings: {
          access_token: "1234",
          link_users_in_hull: true,
          user_claims: [
              {
                  hull: "email",
                  service: "emails"
              },
              {
                  hull: "external_id",
                  service: "externalId"
              }
          ],
          incoming_user_attributes: [
            {
                "hull": "traits_outreach/custom1",
                "service": "custom1"
            },
            {
                "hull": "traits_outreach/personalNote1",
                "service": "personalNote1"
            },
          ],
          incoming_account_attributes: [
            {
                "hull": "traits_outreach/custom1",
                "service": "custom1"
            },
            {
                "hull": "traits_outreach/custom10",
                "service": "custom10"
            },
          ],
          account_claims: [
              {
                  "hull": "domain",
                  "service": "domain"
              },
              {
                  "hull": "external_id",
                  "service": "customId"
              }
          ]
        }
      },
      usersSegments: [],
      accountsSegments: [],
      externalApiMock: () => {
        const scope = nock("https://api.outreach.io");
        scope.get("/api/v2/webhooks/")
          .reply(200, require("../fixtures/api-responses/existing-webhook.json"));
        scope
          .post("/api/v2/webhooks/")
          .reply(201, require("../fixtures/api-responses/create-webhook.json"));

        // can't find a reliable way to get organization right now, so no delete is issued
        // scope
        //     .delete("/api/v2/webhooks/31")
        //     .reply(204);

        const listOfProspects = _.cloneDeep(require("../fixtures/api-responses/list-prospects-page1.json"));
        for (let i = 0; i < 99; i+=1) {
          const prospect = listOfProspects.data[listOfProspects.data.length - 1];
          prospect.id = prospect.id + 1;
          prospect.attributes.emails = [`prospect${i}@somedomain.com`];
          listOfProspects.data.push(prospect);
        }
        scope
          .get("/api/v2/prospects/?sort=id&page[limit]=100&filter[id]=0..inf")
          .reply(200, listOfProspects);
        scope
          .get("/api/v2/prospects/?sort=id&page[limit]=100&filter[id]=109..inf")
          .reply(200, require("../fixtures/api-responses/list-prospects-page2.json"));
        return scope;
      },
      response: { status : "deferred"},
      logs: _.fill(new Array(117), [expect.whatever(), expect.whatever(), expect.whatever(), expect.whatever()]),
      firehoseEvents: _.fill(new Array(111), ["traits", expect.whatever(), expect.whatever()]),
      metrics: _.fill(new Array(120), [expect.whatever(), expect.whatever(), expect.whatever()]),
      platformApiCalls: [
        ["GET", "/api/v1/app", {}, {}],
        ["GET", "/api/v1/users_segments?shipId=9993743b22d60dd829001999", {"shipId": "9993743b22d60dd829001999"}, {}],
        ["GET", "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999", {"shipId": "9993743b22d60dd829001999"}, {}],
        ["GET", "/api/v1/app", {}, {}], ["PUT", "/api/v1/9993743b22d60dd829001999", {}, {"private_settings": {"access_token": "1234", "account_claims": [{"hull": "domain", "service": "domain"}, {"hull": "external_id", "service": "customId"}], "incoming_account_attributes": [{"hull": "traits_outreach/custom1", "service": "custom1"}, {"hull": "traits_outreach/custom10", "service": "custom10"}], "incoming_user_attributes": [{"hull": "traits_outreach/custom1", "service": "custom1"}, {"hull": "traits_outreach/personalNote1", "service": "personalNote1"}], "link_users_in_hull": true, "user_claims": [{"hull": "email", "service": "emails"}, {"hull": "external_id", "service": "externalId"}], "webhook_id": 3}}]
      ]
    };
  });
});
