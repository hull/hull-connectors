// @flow

const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");
const companyPropertyGroups = require("../fixtures/get-properties-companies-groups.json");
import connectorConfig from "../../../server/config";

process.env.OVERRIDE_HUBSPOT_URL = "";
process.env.CLIENT_ID = 1;
process.env.CLIENT_SECRET = 1;

const connector = {
  private_settings: {
    handle_accounts: true,
    token: "hubToken",
    companies_last_fetch_at: 1589481641000,
    mark_deleted_contacts: false,
    mark_deleted_companies: false
  }
};

it("Should fetch recent companies", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.scheduleHandler,
      handlerUrl: "fetch-recent-companies",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/contacts/v2/groups?includeProperties=true")
          .reply(200, []);
        scope.get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, companyPropertyGroups);
        scope.get("/companies/v2/companies/recent/modified?since=1589481641000&count=100")
          .reply(200, {
            "results": [
              {
                "portalId": 123456,
                "companyId": 1,
                "properties": {
                  "hs_lastmodifieddate": {
                    "value": "1589481642000"
                  },
                  "domain": {
                    "value": "apple.com"
                  },
                  "about_us": {
                    "value": "apple"
                  },
                  "numberofemployees": {
                    "value": "20"
                  }
                }
              }
            ],
            "hasMore": true,
            "offset": 9900,
            "total": 63803
          });
        scope.get("/companies/v2/companies/recent/modified?since=1589481641000&offset=9900&count=100")
          .reply(200, {
            "results": [
              {
                "portalId": 123456,
                "companyId": 2,
                "properties": {
                  "hs_lastmodifieddate": {
                    "value": "1589481642000"
                  },
                  "domain": {
                    "value": "microsoft.com"
                  },
                  "about_us": {
                    "value": "microsoft"
                  },
                  "numberofemployees": {
                    "value": "30"
                  }
                }
              },
              {
                "portalId": 123456,
                "companyId": 3,
                "properties": {
                  "hs_lastmodifieddate": {
                    "value": "1589481642000"
                  },
                  "about_us": {
                    "value": "apple"
                  },
                  "numberofemployees": {
                    "value": "40"
                  }
                }
              }
            ],
            "hasMore": true,
            "offset": 10000,
            "total": 63803
          });
        return scope;
      },
      connector,
      usersSegments: [],
      accountsSegments: [],
      response: {"status": "deferred"},
      logs: [
        ["info","incoming.job.start",{},{"jobName":"Incoming Data","type":"webpayload"}],
        ["debug","connector.service_api.call",{},{"responseTime":expect.whatever(),"method":"GET","url":"/companies/v2/companies/recent/modified","status":200,"vars":{}}],
        ["debug","connector.service_api.call",{},{"responseTime":expect.whatever(),"method":"GET","url":"/contacts/v2/groups","status":200,"vars":{}}],
        ["debug","connector.service_api.call",{},{"responseTime":expect.whatever(),"method":"GET","url":"/properties/v1/companies/groups","status":200,"vars":{}}],
        ["debug","saveCompanies",{},1],
        ["debug","incoming.account",{},{"claims":{"domain":"apple.com","anonymous_id":"hubspot:1"},"traits":{"hubspot/numberofemployees": 20, "hubspot/id":1,"hubspot/domain":"apple.com","hubspot/about_us":"apple","hubspot/hs_lastmodified_date":1589481642000}}],
        ["debug","incoming.account.success",{"subject_type":"account","account_domain":"apple.com","account_anonymous_id":"hubspot:1"},{"traits":{"hubspot/numberofemployees": 20, "hubspot/id":1,"hubspot/domain":"apple.com","hubspot/about_us":"apple","hubspot/hs_lastmodified_date":1589481642000}}],
        ["debug","connector.service_api.call",{},{"responseTime":expect.whatever(),"method":"GET","url":"/companies/v2/companies/recent/modified","status":200,"vars":{}}],
        ["debug","saveCompanies",{},2],
        ["debug","incoming.account",{},{"claims":{"domain":"microsoft.com","anonymous_id":"hubspot:2"},"traits":{"hubspot/numberofemployees": 30, "hubspot/id":2,"hubspot/domain":"microsoft.com","hubspot/about_us":"microsoft","hubspot/hs_lastmodified_date":1589481642000}}],
        ["info", "incoming.account.skip", {},
          {
            "company": 3,
            "reason": "Value of field \"properties.domain.value\" is empty, cannot map it to domain, but it's required."
          }
        ],
        ["debug","incoming.account.success",{"subject_type":"account","account_domain":"microsoft.com","account_anonymous_id":"hubspot:2"},{"traits":{"hubspot/numberofemployees": 30, "hubspot/id":2,"hubspot/domain":"microsoft.com","hubspot/about_us":"microsoft","hubspot/hs_lastmodified_date":1589481642000}}],
        ["info","incoming.job.success",{},{"jobName":"Incoming Data","type":"webpayload"}]
      ],
      firehoseEvents: [
        ["traits",
          { "asAccount":{"domain":"apple.com","anonymous_id":"hubspot:1"},"subjectType":"account"},
          { "hubspot/numberofemployees": 20, "hubspot/id":1,"hubspot/domain":"apple.com","hubspot/about_us":"apple","hubspot/hs_lastmodified_date":1589481642000}
        ],
        ["traits",
          { "asAccount":{"domain":"microsoft.com","anonymous_id":"hubspot:2"},"subjectType":"account"},
          { "hubspot/numberofemployees": 30, "hubspot/id":2,"hubspot/domain":"microsoft.com","hubspot/about_us":"microsoft","hubspot/hs_lastmodified_date":1589481642000}
        ]
      ],
      metrics: [
        ["increment","connector.request",1],
        ["increment","ship.service_api.call",1],
        ["value","connector.service_api.response_time",expect.whatever()],
        ["increment","ship.service_api.call",1],
        ["value","connector.service_api.response_time",expect.whatever()],
        ["increment","ship.service_api.call",1],
        ["value","connector.service_api.response_time",expect.whatever()],
        ["increment","ship.incoming.accounts",1],
        ["increment","ship.service_api.call",1],
        ["value","connector.service_api.response_time",expect.whatever()],
        ["increment","ship.incoming.accounts",2]
      ],
      platformApiCalls: [
        ["GET","/api/v1/app",{},{}],
        ["PUT","/api/v1/9993743b22d60dd829001999",{},{"private_settings":{"handle_accounts":true,"token":"hubToken","companies_last_fetch_at":expect.whatever(), "companies_last_fetch_timestamp":expect.whatever(), "mark_deleted_contacts":false,"mark_deleted_companies":false},"refresh_status":false}],
        ["GET","/api/v1/app",{},{}],
        ["PUT","/api/v1/9993743b22d60dd829001999",{},{"private_settings":{"handle_accounts":true,"token":"hubToken","companies_last_fetch_at":null,"mark_deleted_contacts":false,"mark_deleted_companies":false},"refresh_status":false}]
      ]
    };
  });
});
