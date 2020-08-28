// @flow
import connectorConfig from "../../../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";
process.env.COMBINED = true;

describe("Insert Company Tests", () => {

  it("should insert a company after lookup returns empty", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        connector: {
          private_settings: {
            webhook_id: "1",
            tag_companies: true,
            access_token: "intercomABC",
            synchronized_account_segments: ["account_segment_1"],
            account_claims: [
              { hull: "external_id", service: "company_id" },
              { hull: "domain", service: "name" },
            ],
            outgoing_account_attributes: [
              { "hull": "domain", "service": "website" },
              { "hull": "intercom/monthly_spend", "service": "monthly_spend" },
              { "hull": "intercom/monthly_spend", "service": "custom_monthly_spend" },
              { "hull": "intercom/size", "service": "size" }
            ],
            incoming_account_attributes: [
              { hull: "intercom/c_tags", service: "tags", "overwrite": true },
              { hull: "intercom/c_segments", service: "segments", "overwrite": true },
              { hull: 'intercom/web_sessions', service: 'session_count', overwrite: true },
              { hull: 'intercom/website', service: 'website', overwrite: true },
              { hull: 'intercom/name', service: 'name', overwrite: true },
              { hull: 'intercom/monthly_spend', service: 'monthly_spend', overwrite: true },
              { hull: 'intercom/description', service: 'custom_attributes.company_description', overwrite: true }
            ]
          }
        },
        usersSegments: [],
        accountsSegments: [ { id: "account_segment_1", name: "Segment 1" }],
        externalApiMock: () => {
          const scope = nock("https://api.intercom.io");

          scope
            .get("/data_attributes?model=company")
            .reply(200, {
              "type": "list",
              "data": [
                {
                  "type": "data_attribute",
                  "name": "name",
                  "full_name": "name",
                  "label": "Company name",
                  "description": "The name of a company",
                  "data_type": "string",
                  "api_writable": true,
                  "ui_writable": true,
                  "custom": false,
                  "archived": false,
                  "model": "company"
                },
                {
                  "type": "data_attribute",
                  "name": "company_id",
                  "full_name": "company_id",
                  "label": "Company ID",
                  "description": "A number identifying a company",
                  "data_type": "string",
                  "api_writable": false,
                  "ui_writable": false,
                  "custom": false,
                  "archived": false,
                  "model": "company"
                },
                {
                  "type": "data_attribute",
                  "name": "monthly_spend",
                  "full_name": "monthly_spend",
                  "label": "Monthly Spend",
                  "description": "The monthly revenue you receive from a company",
                  "data_type": "float",
                  "api_writable": true,
                  "ui_writable": false,
                  "custom": false,
                  "archived": false,
                  "model": "company"
                },
                {
                  "type": "data_attribute",
                  "name": "size",
                  "full_name": "size",
                  "label": "Company size",
                  "description": "The number of people employed in this company, expressed as a single number",
                  "data_type": "integer",
                  "api_writable": true,
                  "ui_writable": true,
                  "custom": false,
                  "archived": false,
                  "model": "company"
                },
                {
                  "id": 7678696,
                  "type": "data_attribute",
                  "name": "custom_monthly_spend",
                  "full_name": "custom_attributes.custom_monthly_spend",
                  "label": "company_description",
                  "data_type": "string",
                  "api_writable": true,
                  "ui_writable": false,
                  "custom": true,
                  "archived": false,
                  "admin_id": "3330619",
                  "created_at": 1595445305,
                  "updated_at": 1595445305,
                  "model": "company"
                },
              ]
            });

          scope
            .get("/companies?company_id=account_external_id_1")
            .reply(404, {
              "type": "error.list",
              "request_id": "001kil5vake9eikife90",
              "errors": [
                {
                  "code": "company_not_found",
                  "message": "Company Not Found"
                }
              ]
            });

          scope
            .get("/companies?name=rei.com")
            .reply(404, {
              "type": "error.list",
              "request_id": "001kil5vake9eikife90",
              "errors": [
                {
                  "code": "company_not_found",
                  "message": "Company Not Found"
                }
              ]
            });

          scope
            .post("/companies", {
              "website": "rei.com",
              "name": "rei.com",
              "monthly_spend": 500,
              "company_id": "account_external_id_1",
              "size": 50,
              "custom_attributes": {
                "custom_monthly_spend" : 500
              }
            })
            .reply(200, {
              "type": "company",
              "website": "rei.com",
              "company_id": "account_external_id_1",
              "id": "5f161ef9ce73f3ea2605304e",
              "app_id": "lkqcyt9t",
              "name": "rei.com",
              "created_at": 1595285241,
              "updated_at": 1595445513,
              "monthly_spend": 250,
              "session_count": 3,
              "user_count": 1,
              "size": 10,
              "tags": {
                "type": "tag.list",
                "tags": [
                  {
                    "type": "tag",
                    "id": "4399420",
                    "name": "Tag1"
                  },
                  {
                    "type": "tag",
                    "id": "4399420",
                    "name": "Tag1"
                  },
                  {
                    "type": "tag",
                    "id": "4399421",
                    "name": "Tag2"
                  },
                  {
                    "type": "tag",
                    "id": "4399421",
                    "name": "Tag3"
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
                "company_description": "rei - outdoor recreation"
              }
            });

          scope
            .get("/companies/5f161ef9ce73f3ea2605304e/segments")
            .reply(200, {
              "type": "list",
              "data": []
            });

          scope
            .post("/tags", {
              "name": "Account Segment 1",
              "companies": [
                {
                  "id" : "5f161ef9ce73f3ea2605304e"
                }
              ]
            })
            .reply(200, {
                "type": "tag",
                "name": "Account Segment 1",
                "id": "tag_id_1"
              });

          scope
            .post("/tags", {
              "name": "Account Segment 4",
              "companies": [
                {
                  "id" : "5f161ef9ce73f3ea2605304e",
                  "untag": true
                }
              ]
            })
            .reply(200, {
              "type": "tag",
              "name": "Account Segment 4",
              "id": "tag_id_4"
            });

          scope
            .post("/tags", {
              "name": "Account Segment 5",
              "companies": [
                {
                  "id" : "5f161ef9ce73f3ea2605304e",
                  "untag": true
                }
              ]
            })
            .reply(200, {
              "type": "tag",
              "name": "Account Segment 5",
              "id": "tag_id_5"
            });

          return scope;
        },
        messages: [
          {
            account: {
              id: "1",
              external_id: "account_external_id_1",
              domain: "rei.com",
              "intercom/tags": ["Account Segment 2", "Account Segment 3", "Intercom Tag 1", "Intercom Tag 2"],
              "name": "Rei",
              "intercom/name": "Rei",
              "intercom/monthly_spend": 500,
              "intercom/size": 50
            },
            user: {},
            account_segments: [
              { id: "account_segment_1", name: "Account Segment 1" },
              { id: "account_segment_2", name: "Account Segment 2" },
              { id: "account_segment_3", name: "Account Segment 3   " },
              { id: "account_segment_4", name: "Intercom Tag 1" }
            ],
            changes: {
              account: {
                "intercom/monthly_spend": [0, 500]
              },
              account_segments: {
                entered: [
                  { id: "account_segment_1", name: "Account Segment 1" },
                  { id: "account_segment_2", name: "Account Segment 2" }
                ],
                left: [
                  { id: "account_segment_4", name: "Account Segment 4" },
                  { id: "account_segment_5", name: "Account Segment 5" }
                ]
              }
            },
            events: []
          }
        ],
        response: { "flow_control": { "type": "next", } },
        logs: [
          [
            "info",
            "outgoing.job.start",
            {
              "request_id": expect.whatever()
            },
            {
              "jobName": "Outgoing Data",
              "type": "account"
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {
              "request_id": expect.whatever()
            },
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "/data_attributes?model=company",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {
              "request_id": expect.whatever()
            },
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "/companies",
              "status": 404,
              "vars": {}
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {
              "request_id": expect.whatever()
            },
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "/companies",
              "status": 404,
              "vars": {}
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {
              "request_id": expect.whatever()
            },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "/companies",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "info",
            "outgoing.account.success",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_id": "1",
              "account_external_id": "account_external_id_1",
              "account_domain": "rei.com"
            },
            {
              "data": {
                "website": "rei.com",
                "monthly_spend": 500,
                "custom_attributes": {
                  "custom_monthly_spend": 500
                },
                "size": 50,
                "company_id": "account_external_id_1",
                "name": "rei.com"
              },
              "type": "Company"
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {
              "request_id": expect.whatever()
            },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "/tags",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {
              "request_id": expect.whatever()
            },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "/tags",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {
              "request_id": expect.whatever()
            },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "/tags",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {
              "request_id": expect.whatever()
            },
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "/companies/5f161ef9ce73f3ea2605304e/segments",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "debug",
            "incoming.account.success",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_external_id": "account_external_id_1",
              "account_domain": "rei.com",
              "account_anonymous_id": "intercom:5f161ef9ce73f3ea2605304e"
            },
            {
              "data": {
                "type": "company",
                "website": "rei.com",
                "company_id": "account_external_id_1",
                "id": "5f161ef9ce73f3ea2605304e",
                "app_id": "lkqcyt9t",
                "name": "rei.com",
                "created_at": 1595285241,
                "updated_at": 1595445513,
                "monthly_spend": 250,
                "session_count": 3,
                "user_count": 1,
                "size": 10,
                "tags": {
                  "type": "tag.list",
                  "tags": [
                    {
                      "type": "tag",
                      "id": "4399420",
                      "name": "Tag1"
                    },
                    {
                      "type": "tag",
                      "id": "4399420",
                      "name": "Tag1"
                    },
                    {
                      "type": "tag",
                      "id": "4399421",
                      "name": "Tag2"
                    },
                    {
                      "type": "tag",
                      "id": "4399421",
                      "name": "Tag3"
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
                  "company_description": "rei - outdoor recreation"
                }
              },
              "type": "Company"
            }
          ],
          [
            "info",
            "outgoing.job.success",
            {
              "request_id": expect.whatever()
            },
            {
              "jobName": "Outgoing Data",
              "type": "account"
            }
          ]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asAccount": {
                "external_id": "account_external_id_1",
                "domain": "rei.com",
                "anonymous_id": "intercom:5f161ef9ce73f3ea2605304e"
              },
              "subjectType": "account"
            },
            {
              "intercom/c_segments": {
                "operation": "set",
                "value": []
              },
              "intercom/c_tags": {
                "operation": "set",
                "value": ["Tag1", "Tag2", "Tag3" ]
              },
              "intercom/web_sessions": {
                "operation": "set",
                "value": 3
              },
              "intercom/website": {
                "operation": "set",
                "value": "rei.com"
              },
              "intercom/name": {
                "operation": "set",
                "value": "rei.com"
              },
              "intercom/monthly_spend": {
                "operation": "set",
                "value": 250
              },
              "intercom/description": {
                "operation": "set",
                "value": "rei - outdoor recreation"
              },
              "intercom/id": {
                "operation": "set",
                "value": "5f161ef9ce73f3ea2605304e"
              },
              "name": {
                "operation": "setIfNull",
                "value": "rei.com"
              }
            }
          ]
        ],
        metrics: [
          ["increment","connector.request",1],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","connector.service_api.error",1],
          ["increment","service.service_api.errors",1],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","connector.service_api.error",1],
          ["increment","service.service_api.errors",1],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()]
        ],
        platformApiCalls: []
      };
    });
  });
});
