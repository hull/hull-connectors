// @flow
import connectorConfig from "../../../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";

const private_settings = {
  instance_url: "https://na98.salesforce.com",
  refresh_token: "3Kep801hRJqEPUTYG_dW97P8laAje15mN6om7CqloiJSXBzxCJe5v32KztUkaWCm4GqBsKxm5UgDbG9Zt1gn4Y.",
  access_token: "99A5L000002rwPv!WEkDFONqSN.K2dfgNwPcPQdleLxBwAZcDEFGHrZOIYtDSr8IDDmTlJRKdFGH1Cn0xw3BfKHEWnceyK9WZerHU6iRgflKwzOBo",
  fetch_resource_schema: false,
  fetch_accounts: true,
  ignore_users_withoutemail: false,
  ignore_users_withoutchanges: false,
  fetch_tasks: false,
  send_outgoing_tasks: false,
  lead_assignmentrule: "none",
  lead_assignmentrule_update: "none",
  lead_attributes_outbound: [],
  contact_attributes_outbound: [],
  account_attributes_outbound: [],
  lead_attributes_inbound: [],
  contact_attributes_inbound: [],
  account_attributes_inbound: [],
  events_mapping: [],
  task_references_outbound: [],
  task_attributes_outbound: [],
  lead_synchronized_segments: [],
  contact_synchronized_segments: [],
  account_synchronized_segments: []
}

describe("Fetch Accounts Tests", () => {

  it("should fetch account without a website", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "fetch-recent-accounts",
        connector: {
          private_settings: {
            ...private_settings,
            "lead_synchronized_segments": [
              "5a0c1f07b4d8644425002c65"
            ],
            "lead_attributes_outbound": [
              {
                "hull": "first_name",
                "service": "FirstName",
                "overwrite": false
              },
              {
                "hull": "last_name",
                "service": "LastName",
                "overwrite": false
              },
              {
                "hull": "email",
                "service": "Email",
                "overwrite": false
              }
            ],
            "contact_attributes_outbound": [
              {
                "hull": "first_name",
                "service": "FirstName",
                "overwrite": false
              },
              {
                "hull": "last_name",
                "service": "LastName",
                "overwrite": false
              },
              {
                "hull": "email",
                "service": "Email",
                "overwrite": false
              }
            ],
            "account_attributes_outbound": [
              {
                "hull": "domain",
                "service": "Website",
                "overwrite": false
              },
              {
                "hull": "name",
                "service": "Name",
                "overwrite": false
              }
            ],
            "fetch_accounts": true,
            "lead_attributes_inbound": [
              {
                "service": "FirstName",
                "hull": "traits_salesforce_lead/first_name",
                "overwrite": false
              },
              {
                "service": "LastName",
                "hull": "traits_salesforce_lead/last_name",
                "overwrite": false
              },
              {
                "service": "Company",
                "hull": "traits_salesforce_lead/company",
                "overwrite": false
              },
              {
                "service": "Email",
                "hull": "traits_salesforce_lead/email",
                "overwrite": false
              },
              {
                "service": "Website",
                "hull": "traits_salesforce_lead/website",
                "overwrite": false
              }
            ],
            "account_attributes_inbound": [
              {
                "service": "Website",
                "hull": "salesforce/website",
                "overwrite": false
              }
            ],
            "account_claims": [
              {
                "hull": "external_id",
                "service": "CustomIdentifierField",
                "required": false
              }
            ],
            "link_accounts": false
          }
        },
        usersSegments: [],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Account") && !query.q.match("AND Website != null");
            })
            .reply(200, {
              "totalSize": 1,
              "nextRecordsUrl": "/services/data/v42.0/query/0go0dVM-2000",
              "done": true,
              "records": [
                {
                  "attributes": {
                    "type": "Account",
                    "url": "/services/data/v39.0/sobjects/Account/0011I000007Cy18QAC"
                  },
                  "CustomIdentifierField": "1234",
                  "Id": "0011I000007Cy18QAC",
                  "Website": "krakowtraders.pl",
                  "Name": "Krakow Trades",
                  "Mrr__c": 950
                }
              ] }, { "sforce-limit-info": "api-usage=500/50000" });

          return scope;
        },
        response: { status : "deferred"},
        logs: [
          [
            "info",
            "incoming.job.start",
            {},
            {
              "jobName": "Incoming Data",
              "type": "webpayload"
            }
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": expect.whatever(),
              "url": expect.whatever()
            }
          ],
          [
            "info",
            "incoming.job.progress",
            {},
            {
              "jobName": "fetch-accounts",
              "progress": "1 / 1"
            }
          ],
          [
            "info",
            "incoming.account.success",
            {
              "subject_type": "account",
              "account_external_id": "1234",
              "account_anonymous_id": "salesforce:0011I000007Cy18QAC"
            },
            {
              "traits": {
                "salesforce/website": {
                  "value": "krakowtraders.pl",
                  "operation": "set"
                },
                "salesforce/id": {
                  "value": "0011I000007Cy18QAC",
                  "operation": "setIfNull"
                }
              }
            }
          ],
          [
            "info",
            "incoming.job.success",
            {},
            {
              "jobName": "Incoming Data",
              "type": "webpayload"
            }
          ]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asAccount": {
                "external_id": "1234",
                "anonymous_id": "salesforce:0011I000007Cy18QAC"
              },
              "subjectType": "account"
            },
            {
              "salesforce/website": {
                "value": "krakowtraders.pl",
                "operation": "set"
              },
              "salesforce/id": {
                "value": "0011I000007Cy18QAC",
                "operation": "setIfNull"
              }
            }
          ]
        ],
        metrics: [
          ["increment","connector.request",1],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500]
        ],
        platformApiCalls: [
          ["GET", "/api/v1/app", {}, {}],
          [
            "PUT",
            "/api/v1/9993743b22d60dd829001999",
            {},
            expect.objectContaining({"private_settings": expect.whatever()})
          ]
        ]
      };
    });
  });

  it("should fetch account", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "fetch-recent-accounts",
        connector: {
          private_settings: {
            ...private_settings,
            "lead_synchronized_segments": [
              "5a0c1f07b4d8644425002c65"
            ],
            "lead_attributes_outbound": [
              {
                "hull": "first_name",
                "service": "FirstName",
                "overwrite": false
              },
              {
                "hull": "last_name",
                "service": "LastName",
                "overwrite": false
              },
              {
                "hull": "email",
                "service": "Email",
                "overwrite": false
              }
            ],
            "contact_attributes_outbound": [
              {
                "hull": "first_name",
                "service": "FirstName",
                "overwrite": false
              },
              {
                "hull": "last_name",
                "service": "LastName",
                "overwrite": false
              },
              {
                "hull": "email",
                "service": "Email",
                "overwrite": false
              }
            ],
            "account_attributes_outbound": [
              {
                "hull": "domain",
                "service": "Website",
                "overwrite": false
              },
              {
                "hull": "name",
                "service": "Name",
                "overwrite": false
              }
            ],
            "fetch_accounts": true,
            "lead_attributes_inbound": [
              {
                "service": "FirstName",
                "hull": "traits_salesforce_lead/first_name",
                "overwrite": false
              },
              {
                "service": "LastName",
                "hull": "traits_salesforce_lead/last_name",
                "overwrite": false
              },
              {
                "service": "Company",
                "hull": "traits_salesforce_lead/company",
                "overwrite": false
              },
              {
                "service": "Email",
                "hull": "traits_salesforce_lead/email",
                "overwrite": false
              },
              {
                "service": "Website",
                "hull": "traits_salesforce_lead/website",
                "overwrite": false
              }
            ],
            "account_attributes_inbound": [
              {
                "service": "Website",
                "hull": "salesforce/website",
                "overwrite": false
              }
            ],
            "account_claims": [
              {
                "hull": "domain",
                "service": "Website",
                "required": true
              },
              {
                "hull": "external_id",
                "service": "CustomField1",
                "required": true
              }
            ]
          }
        },
        usersSegments: [],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Account") && query.q.match("AND Website != null") && query.q.match("AND CustomField1 != null");
            })
            .reply(200, {
              totalSize: 1,
              done: true,
              records: [
                {
                  attributes: {
                    type: "Account",
                    url: "/services/data/v39.0/sobjects/Account/0011I000007Cy18QAC"
                  },
                  Id: "0011I000007Cy18QAC",
                  Website: "krakowtraders.pl",
                  Name: "Krakow Trades",
                  Mrr__c: 950,
                  CustomField1: "0011I000007Cy18QAC"
                }
              ] }, { "sforce-limit-info": "api-usage=500/50000" });

          return scope;
        },
        response: { status : "deferred"},
        logs: [
          [
            "info",
            "incoming.job.start",
            {},
            {
              "jobName": "Incoming Data",
              "type": "webpayload"
            }
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": expect.whatever(),
              "url": expect.whatever()
            }
          ],
          [
            "info",
            "incoming.job.progress",
            {},
            {
              "jobName": "fetch-accounts",
              "progress": "1 / 1"
            }
          ],
          [
            "info",
            "incoming.account.success",
            {
              "subject_type": "account",
              "account_external_id": "0011I000007Cy18QAC",
              "account_domain": "krakowtraders.pl",
              "account_anonymous_id": "salesforce:0011I000007Cy18QAC"
            },
            {
              "traits": {
                "salesforce/website": {
                  "value": "krakowtraders.pl",
                  "operation": "set"
                },
                "salesforce/id": {
                  "value": "0011I000007Cy18QAC",
                  "operation": "setIfNull"
                }
              }
            }
          ],
          [
            "info",
            "incoming.job.success",
            {},
            {
              "jobName": "Incoming Data",
              "type": "webpayload"
            }
          ]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asAccount": {
                "external_id": "0011I000007Cy18QAC",
                "domain": "krakowtraders.pl",
                "anonymous_id": "salesforce:0011I000007Cy18QAC"
              },
              "subjectType": "account"
            },
            {
              "salesforce/website": {
                "value": "krakowtraders.pl",
                "operation": "set"
              },
              "salesforce/id": {
                "value": "0011I000007Cy18QAC",
                "operation": "setIfNull"
              }
            }
          ]
        ],
        metrics: [
          ["increment","connector.request",1],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500]
        ],
        platformApiCalls: [
          ["GET", "/api/v1/app", {}, {}],
          [
            "PUT",
            "/api/v1/9993743b22d60dd829001999",
            {},
            expect.objectContaining({"private_settings": expect.whatever()})
          ]
        ]
      };
    });
  });

  it("should fetch duplicated accounts", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "fetch-recent-accounts",
        connector: {
          private_settings: {
            ...private_settings,
            "lead_synchronized_segments": [
              "5a0c1f07b4d8644425002c65"
            ],
            "lead_attributes_outbound": [
              {
                "hull": "first_name",
                "service": "FirstName",
                "overwrite": false
              },
              {
                "hull": "last_name",
                "service": "LastName",
                "overwrite": false
              },
              {
                "hull": "email",
                "service": "Email",
                "overwrite": false
              }
            ],
            "contact_attributes_outbound": [
              {
                "hull": "first_name",
                "service": "FirstName",
                "overwrite": false
              },
              {
                "hull": "last_name",
                "service": "LastName",
                "overwrite": false
              },
              {
                "hull": "email",
                "service": "Email",
                "overwrite": false
              }
            ],
            "account_attributes_outbound": [
              {
                "hull": "domain",
                "service": "Website",
                "overwrite": false
              },
              {
                "hull": "name",
                "service": "Name",
                "overwrite": false
              }
            ],
            "fetch_accounts": true,
            "lead_attributes_inbound": [
              {
                "service": "FirstName",
                "hull": "traits_salesforce_lead/first_name",
                "overwrite": false
              },
              {
                "service": "LastName",
                "hull": "traits_salesforce_lead/last_name",
                "overwrite": false
              },
              {
                "service": "Company",
                "hull": "traits_salesforce_lead/company",
                "overwrite": false
              },
              {
                "service": "Email",
                "hull": "traits_salesforce_lead/email",
                "overwrite": false
              },
              {
                "service": "Website",
                "hull": "traits_salesforce_lead/website",
                "overwrite": false
              }
            ],
            "account_attributes_inbound": [
              {
                "service": "Website",
                "hull": "salesforce/website",
                "overwrite": false
              }
            ],
            "account_claims": [
              {
                "hull": "domain",
                "service": "Website",
                "required": true
              },
              {
                "hull": "external_id",
                "service": "CustomField1",
                "required": false
              }
            ]
          }
        },
        usersSegments: [],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Account");
            })
            .reply(200, {
              totalSize: 3,
              done: true,
              records: [
                {
                  attributes: {
                    type: "Account",
                    url: "/services/data/v39.0/sobjects/Account/0011I000007Cy18QAC"
                  },
                  Id: "0011I000007Cy18QAC",
                  Website: "krakowtraders.pl",
                  Name: "Krakow Trades",
                  Mrr__c: 950
                },
                {
                  attributes: {
                    type: "Account",
                    url: "/services/data/v39.0/sobjects/Account/0011I000007Cy18QAD"
                  },
                  Id: "0011I000007Cy18QAD",
                  Website: "krakowtraders.pl",
                  Name: "Krakow Trades",
                  Mrr__c: 950
                },
                {
                  attributes: {
                    type: "Account",
                    url: "/services/data/v39.0/sobjects/Account/0011I000007Cy18QAE"
                  },
                  Id: "0011I000007Cy18QAE",
                  Website: "krakowtraders.pl",
                  Name: "Krakow Trades",
                  Mrr__c: 950
                }
              ] }, { "sforce-limit-info": "api-usage=500/50000" });
          return scope;
        },
        response: { status : "deferred"},
        logs: [
          [
            "info",
            "incoming.job.start",
            {},
            {
              "jobName": "Incoming Data",
              "type": "webpayload"
            }
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": expect.whatever(),
              "url": expect.whatever()
            }
          ],
          [
            "info",
            "incoming.job.progress",
            {},
            {
              "jobName": "fetch-accounts",
              "progress": "3 / 3"
            }
          ],
          [
            "info",
            "incoming.account.success",
            {
              "subject_type": "account",
              "account_domain": "krakowtraders.pl",
              "account_anonymous_id": "salesforce:0011I000007Cy18QAC"
            },
            {
              "traits": {
                "salesforce/website": {
                  "value": "krakowtraders.pl",
                  "operation": "set"
                },
                "salesforce/id": {
                  "value": "0011I000007Cy18QAC",
                  "operation": "setIfNull"
                }
              }
            }
          ],
          [
            "info",
            "incoming.account.success",
            {
              "subject_type": "account",
              "account_domain": "krakowtraders.pl",
              "account_anonymous_id": "salesforce:0011I000007Cy18QAD"
            },
            {
              "traits": {
                "salesforce/website": {
                  "value": "krakowtraders.pl",
                  "operation": "set"
                },
                "salesforce/id": {
                  "value": "0011I000007Cy18QAD",
                  "operation": "setIfNull"
                }
              }
            }
          ],
          [
            "info",
            "incoming.account.success",
            {
              "subject_type": "account",
              "account_domain": "krakowtraders.pl",
              "account_anonymous_id": "salesforce:0011I000007Cy18QAE"
            },
            {
              "traits": {
                "salesforce/website": {
                  "value": "krakowtraders.pl",
                  "operation": "set"
                },
                "salesforce/id": {
                  "value": "0011I000007Cy18QAE",
                  "operation": "setIfNull"
                }
              }
            }
          ],
          [
            "info",
            "incoming.job.success",
            {},
            {
              "jobName": "Incoming Data",
              "type": "webpayload"
            }
          ]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asAccount": {
                "domain": "krakowtraders.pl",
                "anonymous_id": "salesforce:0011I000007Cy18QAC"
              },
              "subjectType": "account"
            },
            {
              "salesforce/website": {
                "value": "krakowtraders.pl",
                "operation": "set"
              },
              "salesforce/id": {
                "value": "0011I000007Cy18QAC",
                "operation": "setIfNull"
              }
            }
          ],
          [
            "traits",
            {
              "asAccount": {
                "domain": "krakowtraders.pl",
                "anonymous_id": "salesforce:0011I000007Cy18QAD"
              },
              "subjectType": "account"
            },
            {
              "salesforce/website": {
                "value": "krakowtraders.pl",
                "operation": "set"
              },
              "salesforce/id": {
                "value": "0011I000007Cy18QAD",
                "operation": "setIfNull"
              }
            }
          ],
          [
            "traits",
            {
              "asAccount": {
                "domain": "krakowtraders.pl",
                "anonymous_id": "salesforce:0011I000007Cy18QAE"
              },
              "subjectType": "account"
            },
            {
              "salesforce/website": {
                "value": "krakowtraders.pl",
                "operation": "set"
              },
              "salesforce/id": {
                "value": "0011I000007Cy18QAE",
                "operation": "setIfNull"
              }
            }
          ]
        ],
        metrics: [
          ["increment","connector.request",1],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500]
        ],
        platformApiCalls: [
          ["GET", "/api/v1/app", {}, {}],
          [
            "PUT",
            "/api/v1/9993743b22d60dd829001999",
            {},
            expect.objectContaining({"private_settings": expect.whatever()})
          ]
        ]
      };
    });
  });
});
