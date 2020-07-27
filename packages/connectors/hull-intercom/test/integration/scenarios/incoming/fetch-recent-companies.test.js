// @flow
import connectorConfig from "../../../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";
process.env.COMBINED = true;

describe("Fetch Recent Companies Tests", () => {

  it("should fetch recently updated companies last page is not empty but should be ignored", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "fetch-recent-companies",
        connector: {
          private_settings: {
            access_token: "12345",
            fetch_companies: true,
            companies_last_fetch_timestamp: 1595439770,
            incoming_account_attributes: [
              { hull: "intercom/tags", service: "tags", "overwrite": true },
              { hull: "intercom/segments", service: "segments", "overwrite": true },
              { hull: 'intercom/web_sessions', service: 'session_count', overwrite: true },
              { hull: 'intercom/website', service: 'website', overwrite: true },
              { hull: 'intercom/name', service: 'name', overwrite: true },
              { hull: 'intercom/monthly_spend', service: 'monthly_spend', overwrite: true },
              { hull: 'intercom/description', service: 'company_description', overwrite: true }
            ]
          }
        },
        usersSegments: [],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://api.intercom.io");

          scope
            .get("/companies?page=1&per_page=60&order=desc")
            .reply(200, {
              "type": "list",
              "data": [
                {
                  "type": "company",
                  "website": "rei.com",
                  "company_id": "5f161ef9ce73f3ea2605304f-qualification-company",
                  "id": "5f161ef9ce73f3ea2605304e",
                  "app_id": "lkqcyt9t",
                  "name": "REI",
                  "created_at": 1595285241,
                  "updated_at": 1595448064,
                  "monthly_spend": 0,
                  "session_count": 0,
                  "user_count": 1,
                  "size": 10,
                  "tags": {
                    "type": "tag.list",
                    "tags": [
                      {
                        "type": "tag",
                        "id": "4399420",
                        "name": "NewCompany"
                      }
                    ]
                  },
                  "segments": {
                    "type": "segment.list",
                    "segments": []
                  },
                  "plan": {},
                  "custom_attributes": {
                    "creation_source": "api",
                    "company_description": "rei - outdoor recreation",
                    "CompanyPlanType": "Weekly"
                  }
                }
              ],
              "pages": {
                "type": "pages",
                "next": "https://api.intercom.io/companies?page=2&per_page=60&order=desc",
                "page": 1,
                "per_page": 1,
                "total_pages": 2
              },
              "total_count": 2
            });

          scope
            .get("/companies/5f161ef9ce73f3ea2605304e/segments")
            .reply(200, {
              "type": "list",
              "data": []
            });

          scope
            .get("/companies?page=2&per_page=60&order=desc")
            .reply(200, {
              "type": "list",
              "data": [
                {
                  "type": "company",
                  "company_id": "5f187aa44fd1ce23c1cf25f8-qualification-company",
                  "id": "5f187aa44fd1ce23c1cf25f7",
                  "app_id": "lkqcyt9t",
                  "name": "Sony",
                  "created_at": 1595439780,
                  "updated_at": 1595439780,
                  "monthly_spend": 0,
                  "session_count": 0,
                  "user_count": 1,
                  "tags": {
                    "type": "tag.list",
                    "tags": []
                  },
                  "segments": {
                    "type": "segment.list",
                    "segments": []
                  },
                  "plan": {},
                  "custom_attributes": {}
                },
                {
                  "type": "company",
                  "company_id": "5f187aa44fd1ce23c1cf25f9-qualification-company",
                  "id": "5f187aa44fd1ce23c1cf25f8",
                  "app_id": "lkqcyt9t",
                  "name": "Google",
                  "created_at": 1595439780,
                  "updated_at": 1595439780,
                  "monthly_spend": 0,
                  "session_count": 0,
                  "user_count": 1,
                  "tags": {
                    "type": "tag.list",
                    "tags": []
                  },
                  "segments": {
                    "type": "segment.list",
                    "segments": []
                  },
                  "plan": {},
                  "custom_attributes": {}
                },
                {
                  "type": "company",
                  "company_id": "8340583245352345-qualification-company",
                  "id": "5f187bb44fd1c88admc837",
                  "app_id": "lkqcyt9t",
                  "name": "Apple",
                  "created_at": 1595329780,
                  "updated_at": 1595329780,
                  "monthly_spend": 0,
                  "session_count": 0,
                  "user_count": 1,
                  "tags": {
                    "type": "tag.list",
                    "tags": []
                  },
                  "segments": {
                    "type": "segment.list",
                    "segments": []
                  },
                  "plan": {},
                  "custom_attributes": {}
                }
              ],
              "pages": {
                "type": "pages",
                "next": "https://api.intercom.io/companies?page=2&per_page=60&order=desc",
                "page": 2,
                "per_page": 1,
                "total_pages": 2
              },
              "total_count": 2
            });

          scope
            .get("/companies/5f187aa44fd1ce23c1cf25f7/segments")
            .reply(200, {
              "type": "list",
              "data": []
            });

          scope
            .get("/companies/5f187aa44fd1ce23c1cf25f8/segments")
            .reply(200, {
              "type": "list",
              "data": []
            });

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
            "connector.service_api.call",
            {},
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "/companies",
              "status": 200,
              "vars": {}
            }
          ],
          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "GET", "url": "/companies/5f161ef9ce73f3ea2605304e/segments", "status": 200, "vars": {} }],
          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "GET", "url": "/companies/5f187aa44fd1ce23c1cf25f7/segments", "status": 200, "vars": {} }],
          ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(),
            "method": "GET", "url": "/companies/5f187aa44fd1ce23c1cf25f8/segments", "status": 200, "vars": {} }],
          [
            "debug",
            "incoming.account.success",
            {
              "subject_type": "account",
              "account_external_id": "5f161ef9ce73f3ea2605304f-qualification-company",
              "account_anonymous_id": "intercom:5f161ef9ce73f3ea2605304e",
              "account_domain": "rei.com"
            },
            {
              "data": {
                "type": "company",
                "company_id": "5f161ef9ce73f3ea2605304f-qualification-company",
                "id": "5f161ef9ce73f3ea2605304e",
                "app_id": "lkqcyt9t",
                "name": "REI",
                "created_at": 1595285241,
                "updated_at": 1595448064,
                "monthly_spend": 0,
                "session_count": 0,
                "user_count": 1,
                "website": "rei.com",
                "size": 10,
                "tags": {
                  "type": "tag.list",
                  "tags": [
                    {
                      "type": "tag",
                      "id": "4399420",
                      "name": "NewCompany"
                    }
                  ]
                },
                "segments": {
                  "type": "segment.list",
                  "segments": []
                },
                "plan": {},
                "custom_attributes": {
                  "creation_source": "api",
                  "company_description": "rei - outdoor recreation",
                  "CompanyPlanType": "Weekly"
                }
              },
              "type": "Company"
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {},
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "/companies",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "debug",
            "incoming.account.success",
            {
              "subject_type": "account",
              "account_external_id": "5f187aa44fd1ce23c1cf25f8-qualification-company",
              "account_anonymous_id": "intercom:5f187aa44fd1ce23c1cf25f7"
            },
            {
              "data": {
                "type": "company",
                "company_id": "5f187aa44fd1ce23c1cf25f8-qualification-company",
                "id": "5f187aa44fd1ce23c1cf25f7",
                "app_id": "lkqcyt9t",
                "name": "Sony",
                "created_at": 1595439780,
                "updated_at": 1595439780,
                "monthly_spend": 0,
                "session_count": 0,
                "user_count": 1,
                "tags": {
                  "type": "tag.list",
                  "tags": []
                },
                "segments": {
                  "type": "segment.list",
                  "segments": []
                },
                "plan": {},
                "custom_attributes": {}
              },
              "type": "Company"
            }
          ],
          [
            "debug",
            "incoming.account.success",
            {
              "subject_type": "account",
              "account_external_id": "5f187aa44fd1ce23c1cf25f9-qualification-company",
              "account_anonymous_id": "intercom:5f187aa44fd1ce23c1cf25f8"
            },
            {
              "data": {
                "type": "company",
                "company_id": "5f187aa44fd1ce23c1cf25f9-qualification-company",
                "id": "5f187aa44fd1ce23c1cf25f8",
                "app_id": "lkqcyt9t",
                "name": "Google",
                "created_at": 1595439780,
                "updated_at": 1595439780,
                "monthly_spend": 0,
                "session_count": 0,
                "user_count": 1,
                "tags": {
                  "type": "tag.list",
                  "tags": []
                },
                "segments": {
                  "type": "segment.list",
                  "segments": []
                },
                "plan": {},
                "custom_attributes": {}
              },
              "type": "Company"
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
                "external_id": "5f161ef9ce73f3ea2605304f-qualification-company",
                "domain": "rei.com",
                "anonymous_id": "intercom:5f161ef9ce73f3ea2605304e"
              },
              "subjectType": "account"
            },
            {
              "intercom/segments": {
                "operation": "set",
                "value": []
              },
              "intercom/tags": {
                "operation": "set",
                "value": ["NewCompany"]
              },
              "intercom/web_sessions": {
                "operation": "set",
                "value": 0
              },
              "intercom/name": {
                "operation": "set",
                "value": "REI"
              },
              "intercom/monthly_spend": {
                "operation": "set",
                "value": 0
              },
              "intercom/description": {
                "operation": "set",
                "value": "rei - outdoor recreation"
              },
              "intercom/id": {
                "operation": "set",
                "value": "5f161ef9ce73f3ea2605304e"
              },
              "intercom/website": {
                "operation": "set",
                "value": "rei.com"
              },
              "name": {
                "operation": "setIfNull",
                "value": "REI"
              }
            }
          ],
          [
            "traits",
            {
              "asAccount": {
                "external_id": "5f187aa44fd1ce23c1cf25f8-qualification-company",
                "anonymous_id": "intercom:5f187aa44fd1ce23c1cf25f7"
              },
              "subjectType": "account"
            },
            {
              "intercom/segments": {
                "operation": "set",
                "value": []
              },
              "intercom/tags": {
                "operation": "set",
                "value": []
              },
              "intercom/web_sessions": {
                "operation": "set",
                "value": 0
              },
              "intercom/name": {
                "operation": "set",
                "value": "Sony"
              },
              "intercom/monthly_spend": {
                "operation": "set",
                "value": 0
              },
              "intercom/id": {
                "operation": "set",
                "value": "5f187aa44fd1ce23c1cf25f7"
              },
              "name": {
                "operation": "setIfNull",
                "value": "Sony"
              }
            }
          ],
          [
            "traits",
            {
              "asAccount": {
                "external_id": "5f187aa44fd1ce23c1cf25f9-qualification-company",
                "anonymous_id": "intercom:5f187aa44fd1ce23c1cf25f8"
              },
              "subjectType": "account"
            },
            {
              "intercom/segments": {
                "operation": "set",
                "value": []
              },
              "intercom/tags": {
                "operation": "set",
                "value": []
              },
              "intercom/web_sessions": {
                "operation": "set",
                "value": 0
              },
              "intercom/name": {
                "operation": "set",
                "value": "Google"
              },
              "intercom/monthly_spend": {
                "operation": "set",
                "value": 0
              },
              "intercom/id": {
                "operation": "set",
                "value": "5f187aa44fd1ce23c1cf25f8"
              },
              "name": {
                "operation": "setIfNull",
                "value": "Google"
              }
            }
          ]
        ],
        metrics: [
          ["increment", "connector.request", 1],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.whatever()],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.whatever()],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.whatever()],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.whatever()],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.whatever()]
        ],
        platformApiCalls: [
          [
            "GET",
            "/api/v1/app",
            {},
            {}
          ],
          [
            "PUT",
            "/api/v1/9993743b22d60dd829001999",
            {},
            {
              "private_settings": {
                "access_token": "12345",
                "fetch_companies": true,
                "companies_last_fetch_timestamp": expect.whatever(),
                "incoming_account_attributes": [
                  {
                    "hull": "intercom/tags",
                    "service": "tags",
                    "overwrite": true
                  },
                  {
                    "hull": "intercom/segments",
                    "service": "segments",
                    "overwrite": true
                  },
                  {
                    "hull": "intercom/web_sessions",
                    "service": "session_count",
                    "overwrite": true
                  },
                  {
                    "hull": "intercom/website",
                    "service": "website",
                    "overwrite": true
                  },
                  {
                    "hull": "intercom/name",
                    "service": "name",
                    "overwrite": true
                  },
                  {
                    "hull": "intercom/monthly_spend",
                    "service": "monthly_spend",
                    "overwrite": true
                  },
                  {
                    "hull": "intercom/description",
                    "service": "company_description",
                    "overwrite": true
                  }
                ]
              },
              "refresh_status": false
            }
          ]
        ]
      };
    });
  });

  it("should fetch recently updated companies last page is empty", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "fetch-recent-companies",
        connector: {
          private_settings: {
            access_token: "12345",
            fetch_companies: true,
            companies_last_fetch_timestamp: 1595439770,
            incoming_account_attributes: [
              { hull: "intercom/tags", service: "tags", "overwrite": true },
              { hull: 'intercom/web_sessions', service: 'session_count', overwrite: true },
              { hull: 'intercom/website', service: 'website', overwrite: true },
              { hull: 'intercom/name', service: 'name', overwrite: true },
              { hull: 'intercom/monthly_spend', service: 'monthly_spend', overwrite: true },
              { hull: 'intercom/description', service: 'company_description', overwrite: true }
            ]
          }
        },
        usersSegments: [],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://api.intercom.io");

          scope
            .get("/companies?page=1&per_page=60&order=desc")
            .reply(200, {
              "type": "list",
              "data": [
                {
                  "type": "company",
                  "website": "rei.com",
                  "company_id": "5f161ef9ce73f3ea2605304f-qualification-company",
                  "id": "5f161ef9ce73f3ea2605304e",
                  "app_id": "lkqcyt9t",
                  "name": "REI",
                  "created_at": 1595285241,
                  "updated_at": 1595448064,
                  "monthly_spend": 0,
                  "session_count": 0,
                  "user_count": 1,
                  "size": 10,
                  "tags": {
                    "type": "tag.list",
                    "tags": [
                      {
                        "type": "tag",
                        "id": "4399420",
                        "name": "NewCompany"
                      }
                    ]
                  },
                  "segments": {
                    "type": "segment.list",
                    "segments": []
                  },
                  "plan": {},
                  "custom_attributes": {
                    "creation_source": "api",
                    "company_description": "rei - outdoor recreation",
                    "CompanyPlanType": "Weekly"
                  }
                }
              ],
              "pages": {
                "type": "pages",
                "next": "https://api.intercom.io/companies?page=2&per_page=60&order=desc",
                "page": 1,
                "per_page": 1,
                "total_pages": 2
              },
              "total_count": 2
            });

          scope
            .get("/companies?page=2&per_page=60&order=desc")
            .reply(200, {
              "type": "list",
              "data": [
                {
                  "type": "company",
                  "company_id": "5f187aa44fd1ce23c1cf25f8-qualification-company",
                  "id": "5f187aa44fd1ce23c1cf25f7",
                  "app_id": "lkqcyt9t",
                  "name": "Sony",
                  "created_at": 1595439780,
                  "updated_at": 1595439780,
                  "monthly_spend": 0,
                  "session_count": 0,
                  "user_count": 1,
                  "tags": {
                    "type": "tag.list",
                    "tags": []
                  },
                  "segments": {
                    "type": "segment.list",
                    "segments": []
                  },
                  "plan": {},
                  "custom_attributes": {}
                },
                {
                  "type": "company",
                  "company_id": "5f187aa44fd1ce23c1cf25f9-qualification-company",
                  "id": "5f187aa44fd1ce23c1cf25f8",
                  "app_id": "lkqcyt9t",
                  "name": "Google",
                  "created_at": 1595439780,
                  "updated_at": 1595439780,
                  "monthly_spend": 0,
                  "session_count": 0,
                  "user_count": 1,
                  "tags": {
                    "type": "tag.list",
                    "tags": []
                  },
                  "segments": {
                    "type": "segment.list",
                    "segments": []
                  },
                  "plan": {},
                  "custom_attributes": {}
                }
              ],
              "pages": {
                "type": "pages",
                "next": "https://api.intercom.io/companies?page=3&per_page=60&order=desc",
                "page": 2,
                "per_page": 1,
                "total_pages": 2
              },
              "total_count": 2
            });

          scope
            .get("/companies?page=3&per_page=60&order=desc")
            .reply(200, {
              "type": "list",
              "data": [],
              "pages": {
                "type": "pages",
                "next": null,
                "page": 3,
                "per_page": 20,
                "total_pages": 1
              },
              "total_count": 2
            });

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
            "connector.service_api.call",
            {},
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "/companies",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "debug",
            "incoming.account.success",
            {
              "subject_type": "account",
              "account_external_id": "5f161ef9ce73f3ea2605304f-qualification-company",
              "account_anonymous_id": "intercom:5f161ef9ce73f3ea2605304e",
              "account_domain": "rei.com"
            },
            {
              "data": {
                "type": "company",
                "company_id": "5f161ef9ce73f3ea2605304f-qualification-company",
                "id": "5f161ef9ce73f3ea2605304e",
                "app_id": "lkqcyt9t",
                "name": "REI",
                "created_at": 1595285241,
                "updated_at": 1595448064,
                "monthly_spend": 0,
                "session_count": 0,
                "user_count": 1,
                "website": "rei.com",
                "size": 10,
                "tags": {
                  "type": "tag.list",
                  "tags": [
                    {
                      "type": "tag",
                      "id": "4399420",
                      "name": "NewCompany"
                    }
                  ]
                },
                "segments": {
                  "type": "segment.list",
                  "segments": []
                },
                "plan": {},
                "custom_attributes": {
                  "creation_source": "api",
                  "company_description": "rei - outdoor recreation",
                  "CompanyPlanType": "Weekly"
                }
              },
              "type": "Company"
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {},
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "/companies",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "debug",
            "incoming.account.success",
            {
              "subject_type": "account",
              "account_external_id": "5f187aa44fd1ce23c1cf25f8-qualification-company",
              "account_anonymous_id": "intercom:5f187aa44fd1ce23c1cf25f7"
            },
            {
              "data": {
                "type": "company",
                "company_id": "5f187aa44fd1ce23c1cf25f8-qualification-company",
                "id": "5f187aa44fd1ce23c1cf25f7",
                "app_id": "lkqcyt9t",
                "name": "Sony",
                "created_at": 1595439780,
                "updated_at": 1595439780,
                "monthly_spend": 0,
                "session_count": 0,
                "user_count": 1,
                "tags": {
                  "type": "tag.list",
                  "tags": []
                },
                "segments": {
                  "type": "segment.list",
                  "segments": []
                },
                "plan": {},
                "custom_attributes": {}
              },
              "type": "Company"
            }
          ],
          [
            "debug",
            "incoming.account.success",
            {
              "subject_type": "account",
              "account_external_id": "5f187aa44fd1ce23c1cf25f9-qualification-company",
              "account_anonymous_id": "intercom:5f187aa44fd1ce23c1cf25f8"
            },
            {
              "data": {
                "type": "company",
                "company_id": "5f187aa44fd1ce23c1cf25f9-qualification-company",
                "id": "5f187aa44fd1ce23c1cf25f8",
                "app_id": "lkqcyt9t",
                "name": "Google",
                "created_at": 1595439780,
                "updated_at": 1595439780,
                "monthly_spend": 0,
                "session_count": 0,
                "user_count": 1,
                "tags": {
                  "type": "tag.list",
                  "tags": []
                },
                "segments": {
                  "type": "segment.list",
                  "segments": []
                },
                "plan": {},
                "custom_attributes": {}
              },
              "type": "Company"
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {},
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "/companies",
              "status": 200,
              "vars": {}
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
                "external_id": "5f161ef9ce73f3ea2605304f-qualification-company",
                "domain": "rei.com",
                "anonymous_id": "intercom:5f161ef9ce73f3ea2605304e"
              },
              "subjectType": "account"
            },
            {
              "intercom/tags": {
                "operation": "set",
                "value": ["NewCompany"]
              },
              "intercom/web_sessions": {
                "operation": "set",
                "value": 0
              },
              "intercom/name": {
                "operation": "set",
                "value": "REI"
              },
              "intercom/monthly_spend": {
                "operation": "set",
                "value": 0
              },
              "intercom/description": {
                "operation": "set",
                "value": "rei - outdoor recreation"
              },
              "intercom/id": {
                "operation": "set",
                "value": "5f161ef9ce73f3ea2605304e"
              },
              "intercom/website": {
                "operation": "set",
                "value": "rei.com"
              },
              "name": {
                "operation": "setIfNull",
                "value": "REI"
              }
            }
          ],
          [
            "traits",
            {
              "asAccount": {
                "external_id": "5f187aa44fd1ce23c1cf25f8-qualification-company",
                "anonymous_id": "intercom:5f187aa44fd1ce23c1cf25f7"
              },
              "subjectType": "account"
            },
            {
              "intercom/tags": {
                "operation": "set",
                "value": []
              },
              "intercom/web_sessions": {
                "operation": "set",
                "value": 0
              },
              "intercom/name": {
                "operation": "set",
                "value": "Sony"
              },
              "intercom/monthly_spend": {
                "operation": "set",
                "value": 0
              },
              "intercom/id": {
                "operation": "set",
                "value": "5f187aa44fd1ce23c1cf25f7"
              },
              "name": {
                "operation": "setIfNull",
                "value": "Sony"
              }
            }
          ],
          [
            "traits",
            {
              "asAccount": {
                "external_id": "5f187aa44fd1ce23c1cf25f9-qualification-company",
                "anonymous_id": "intercom:5f187aa44fd1ce23c1cf25f8"
              },
              "subjectType": "account"
            },
            {
              "intercom/tags": {
                "operation": "set",
                "value": []
              },
              "intercom/web_sessions": {
                "operation": "set",
                "value": 0
              },
              "intercom/name": {
                "operation": "set",
                "value": "Google"
              },
              "intercom/monthly_spend": {
                "operation": "set",
                "value": 0
              },
              "intercom/id": {
                "operation": "set",
                "value": "5f187aa44fd1ce23c1cf25f8"
              },
              "name": {
                "operation": "setIfNull",
                "value": "Google"
              }
            }
          ]
        ],
        metrics: [
          ["increment", "connector.request", 1],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.whatever()],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.whatever()],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.whatever()]
        ],
        platformApiCalls: [
          [
            "GET",
            "/api/v1/app",
            {},
            {}
          ],
          [
            "PUT",
            "/api/v1/9993743b22d60dd829001999",
            {},
            {
              "private_settings": {
                "access_token": "12345",
                "fetch_companies": true,
                "companies_last_fetch_timestamp": expect.whatever(),
                "incoming_account_attributes": [
                  {
                    "hull": "intercom/tags",
                    "service": "tags",
                    "overwrite": true
                  },
                  {
                    "hull": "intercom/web_sessions",
                    "service": "session_count",
                    "overwrite": true
                  },
                  {
                    "hull": "intercom/website",
                    "service": "website",
                    "overwrite": true
                  },
                  {
                    "hull": "intercom/name",
                    "service": "name",
                    "overwrite": true
                  },
                  {
                    "hull": "intercom/monthly_spend",
                    "service": "monthly_spend",
                    "overwrite": true
                  },
                  {
                    "hull": "intercom/description",
                    "service": "company_description",
                    "overwrite": true
                  }
                ]
              },
              "refresh_status": false
            }
          ]
        ]
      };
    });
  });
});