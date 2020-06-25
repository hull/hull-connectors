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
  fetch_accounts: false,
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

describe("Fetch Leads Tests", () => {

  it("should fetch a single lead", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "fetchRecentLeads",
        connector: {
          private_settings: {
            ...private_settings,
            fetch_resource_schema: true,
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
            "lead_attributes_inbound": [
              {
                "service": "FirstName",
                "hull": "traits_salesforce_lead/first_name",
                "overwrite": false
              },
              {
                "service": "LastName",
                "hull": "traits_salesforce_lead/custom_last_name_field",
                "overwrite": false
              },
              {
                "service": "Email",
                "hull": "traits_salesforce_lead/email",
                "overwrite": false
              },
              {
                "service": "Company",
                "hull": "traits_salesforce_lead/company",
                "overwrite": false
              },
              {
                "service": "Website",
                "hull": "traits_salesforce_lead/website",
                "overwrite": false
              },
              {
                "service": "Department",
                "hull": "traits_salesforce_lead/contact_department",
                "overwrite": false
              },
              {
                "service": "UserSegments__c",
                "hull": "traits_salesforce_lead/user_segments",
                "overwrite": false
              }
            ],
            "account_attributes_inbound": [
              {
                "service": "Website",
                "hull": "website",
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
            .get("/services/data/v39.0/sobjects/Lead/updated")
            .query((query) => {
              return query.start && query.end;
            })
            .reply(200, { ids: ["00Q1I000004WHbtUAG"] }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Lead");
            })
            .reply(200, { records: [
                {
                  "attributes": {
                    "type": "Lead",
                    "url": "/services/data/v39.0/sobjects/Lead/00Q1I000004WHbtUAG"
                  },
                  "Id": "00Q1I000004WHbtUAG",
                  "Email": "becci.blankenshield@adventure-works.com",
                  "FirstName": "Becci",
                  "LastName": "Blankenshield",
                  "Company": "Adventure Works",
                  "Website": "adventure-works.com",
                  "Status": "Open - Not Contacted",
                  "UserSegments__c": "segment3;segment1;Segment2;12;1;21"
                }
              ] }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/sobjects/Lead/describe")
            .query()
            .reply(200, { fields: [
                {
                  name: "UserSegments__c",
                  picklistValues: [],
                  type: "multipicklist",
                  unique: false,
                  updateable: true
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
              "url": "https://na98.salesforce.com/services/data/v39.0/sobjects/Lead/describe"
            }
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": expect.whatever(),
              "url": expect.stringContaining("https://na98.salesforce.com/services/data/v39.0/sobjects/Lead/updated")
            }
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": expect.whatever(),
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Email%2CFirstName%2CLastName%2CId%2CConvertedAccountId%2CConvertedContactId%2CCompany%2CWebsite%2CDepartment%2CUserSegments__c%20FROM%20Lead%20WHERE%20Id%20IN%20('00Q1I000004WHbtUAG')"
            }
          ],
          [
            "info",
            "incoming.user.success",
            {
              "subject_type": "user",
              "user_email": "becci.blankenshield@adventure-works.com",
              "user_anonymous_id": "salesforce-lead:00Q1I000004WHbtUAG"
            },
            {
              "traits": {
                "first_name": {
                  "value": "Becci",
                  "operation": "setIfNull"
                },
                "salesforce_lead/first_name": {
                  "value": "Becci",
                  "operation": "set"
                },
                "last_name": {
                  "value": "Blankenshield",
                  "operation": "setIfNull"
                },
                "salesforce_lead/custom_last_name_field": {
                  "value": "Blankenshield",
                  "operation": "set"
                },
                "salesforce_lead/email": {
                  "value": "becci.blankenshield@adventure-works.com",
                  "operation": "set"
                },
                "salesforce_lead/company": {
                  "value": "Adventure Works",
                  "operation": "set"
                },
                "salesforce_lead/website": {
                  "value": "adventure-works.com",
                  "operation": "set"
                },
                "salesforce_lead/user_segments": {
                  "value": [
                    "1",
                    "12",
                    "21",
                    "segment1",
                    "Segment2",
                    "segment3"
                  ],
                  "operation": "set"
                },
                "salesforce_lead/id": {
                  "value": "00Q1I000004WHbtUAG",
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
              "asUser": {
                "email": "becci.blankenshield@adventure-works.com",
                "anonymous_id": "salesforce-lead:00Q1I000004WHbtUAG"
              },
              "subjectType": "user"
            },
            {
              "first_name": {
                "value": "Becci",
                "operation": "setIfNull"
              },
              "salesforce_lead/first_name": {
                "value": "Becci",
                "operation": "set"
              },
              "last_name": {
                "value": "Blankenshield",
                "operation": "setIfNull"
              },
              "salesforce_lead/custom_last_name_field": {
                "value": "Blankenshield",
                "operation": "set"
              },
              "salesforce_lead/email": {
                "value": "becci.blankenshield@adventure-works.com",
                "operation": "set"
              },
              "salesforce_lead/company": {
                "value": "Adventure Works",
                "operation": "set"
              },
              "salesforce_lead/website": {
                "value": "adventure-works.com",
                "operation": "set"
              },
              "salesforce_lead/user_segments": {
                "value": ["1", "12", "21", "segment1", "Segment2", "segment3"],
                "operation": "set"
              },
              "salesforce_lead/id": {
                "value": "00Q1I000004WHbtUAG",
                "operation": "setIfNull"
              }
            }
          ]
        ],
        metrics: [
          ["increment","connector.request",1],

          // get ids
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],

          // get entities
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],

          // get resource schema
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],

          ["increment","ship.incoming.users",1],
        ],
        platformApiCalls: []
      };
    });
  });
});
