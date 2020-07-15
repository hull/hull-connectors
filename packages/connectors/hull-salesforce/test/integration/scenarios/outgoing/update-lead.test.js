import connectorConfig from "../../../../server/config";

const createSoapEnvelope = require("../../../helper/soapapiopsresponse");
const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";

const private_settings = {
  instance_url: "https://na98.salesforce.com",
  access_token: "1",
  refresh_token: "1",
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

describe("Update Lead Tests", () => {

  it("should update lead that has not been synced in salesforce", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        "fetch_resource_schema": true,
        "lead_synchronized_segments": [
          "59f09bc7f9c5a94af600076d"
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
          },
          {
            "hull": "traits_company",
            "service": "Company",
            "overwrite": false
          },
          {
            "hull": "domain",
            "service": "Website",
            "overwrite": false
          },
          {
            "hull": "salesforce/lead_segments_concat",
            "service": "LEAD_SEGMENTS__c",
            "overwrite": true
          },
          {
            "hull": "salesforce/lead_stages",
            "service": "LEAD_STAGES__c",
            "overwrite": true
          },
          {
            "hull": "salesforce/lead_random_pl",
            "service": "LEAD_RANDOM_PL__c",
            "overwrite": true
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
            "hull": "website",
            "overwrite": false
          }
        ]
      }
    };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          scope
            .get("/services/data/v39.0/sobjects/Lead/describe")
            .query()
            .reply(200, { fields: [
                {
                  name: "LEAD_SEGMENTS__c",
                  picklistValues: [
                    "AcntSegment1",
                    "AcntSegment2",
                  ],
                  type: "multipicklist",
                  unique: false,
                  updateable: true
                },
                {
                  name: "LEAD_STAGES__c",
                  picklistValues: [
                    "Open",
                    "Closed",
                    "Initial",
                    "Promising",
                    "Prospecting",
                    "Needs Analysis"
                  ],
                  type: "multipicklist",
                  unique: false,
                  updateable: true
                },
                {
                  name: "LEAD_RANDOM_PL__c",
                  picklistValues: [
                    "Decision maker bought-in",
                    "Appointment scheduled",
                    "Qualified to buy",
                    "Sent",
                    "Won",
                    "Lost"
                  ],
                  type: "multipicklist",
                  unique: false,
                  updateable: true
                }
              ] }, { "sforce-limit-info": "api-usage=500/50000" });

        scope.get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Lead");
            })
            .reply(200, {
              records: [
                {
                  attributes: {
                    type: "Lead",
                    url: "/services/data/v39.0/sobjects/Lead/00Q1I000004WHbtUAG"
                  },
                  Id: "00Q1I000004WHbtUAG",
                  Email: "becci.blankenshield@adventure-works.com",
                  FirstName: "Becci",
                  LastName: "Blankenshield",
                  Company: "Adventure Works",
                  Website: "adventure-works.com",
                  Status: "Open - Not Contacted"
                },
                {
                  attributes: {
                    type: "Lead",
                    url: "/services/data/v39.0/sobjects/Lead/00Q1I000004WHchUAG"
                  },
                  Id: "00Q1I000004WO7uUAG",
                  Email: "adam.pietrzyk@krakowtraders.pl",
                  FirstName: "Adam",
                  LastName: "Pietrzyk",
                  Status: "Open - Not Contacted",
                  LEAD_SEGMENTS__c: "LEADSegment1",
                  LEAD_STAGES__c: "Open;Closed;PROSPECTing;Promising;Needs Analysis",
                  LEAD_RANDOM_PL__c: "Appointment scheduled;Qualified to buy;Sent;Won;Lost"
                }
              ],
              done: true
            }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Contact");
            })
            .reply(200, { records: [], done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          const respBody = createSoapEnvelope("updateResponse", { result: [{ id: "00Q1I000004WO7uUAG", success: "true" }] });
          nock("https://na98.salesforce.com")
            .post("/services/Soap/u/39.0")
            .reply(200, respBody, { "Content-Type": "text/xml", "sforce-limit-info": "api-usage=500/50000" });

          return scope;
        },
        connector,
        messages: [
          {
            "message_id": "QV5AEkw4A0RJUytDCypYEU4EISE-MD5FU0RQBhYsXUZIUTcZCGhRDk9eIz81IChFGgtTE1FcdRNCEGxcM3UHUQ0Zc3thfWJcQQVRRVt0W1EaH1lcfksGVAofdH5hd21YFgYCQ3v8ysqh4ZFvZhs9XBJLLD5-MzZF",
            "user": {
              "accepts_marketing": false,
              "anonymous_ids": [
                "salesforce:00Q1I000004WHchUAG"
              ],
              "created_at": "2017-12-27T16:46:48Z",
              "domain": "krakowtraders.pl",
              "email": "adam.pietrzyk@krakowtraders.pl",
              "first_name": "Adam",
              "has_password": false,
              "id": "5a43ce781f6d9f471d005d44",
              "is_approved": false,
              "last_name": "Pietrzyk",
              "name": "Adam Pietrzyk",
              "segment_ids": [
                "59f09bc7f9c5a94af600076d"
              ],
              "traits_coconuts": 38,
              "indexed_at": "2017-12-27T18:15:54+00:00",
              "traits_company": "Krakow Traders",
              "salesforce/lead_segments_concat": "leadsegment1",
              "salesforce/lead_stages": [
                "Closed",
                "prospecting",
                "needs analysis",
                "open",
                "Promising"
              ],
              "salesforce/lead_random_pl": [
                "Appointment scheduled",
                "qualified to buy",
                "Decision maker bought-in",
                "won",
                "lost"
              ]
            },
            "segments": [
              {
                "id": "59f09bc7f9c5a94af600076d",
                "name": "Users signed in last 100 days",
                "type": "users_segment",
                "created_at": "2017-10-25T14:12:23Z",
                "updated_at": "2017-10-25T14:12:23Z"
              }
            ],
            "account": {},
            "account_segments": [],
            "events": [],
            "changes": {
              "user": {
                "traits_coconuts": [
                  null,
                  38
                ]
              },
              "segments": {},
              "account": {},
              "account_segments": {},
              "is_new": false
            }
          }
        ],
        response: { "flow_control": { "type": "next", } },
        logs: [
          ["info", "outgoing.job.start", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "webpayload" }],
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 369,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20FirstName%2C%20LastName%2C%20Email%2C%20Company%2C%20Website%2C%20LEAD_SEGMENTS__c%2C%20LEAD_STAGES__c%2C%20LEAD_RANDOM_PL__c%2C%20Id%2C%20ConvertedAccountId%2C%20ConvertedContactId%20FROM%20Lead%20WHERE%20Email%20IN%20('adam.pietrzyk%40krakowtraders.pl')%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
            }
          ]),
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 248,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20FirstName%2C%20LastName%2C%20Email%2C%20Id%2C%20AccountId%20FROM%20Contact%20WHERE%20Email%20IN%20('adam.pietrzyk%40krakowtraders.pl')%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
            }
          ]),
          expect.arrayContaining([
            "outgoing.job.progress",
            {
              "step": "findResults",
              "sfLeads": 2,
              "sfContacts": 0,
              "sfAccounts": 0,
              "userIds": [
                "5a43ce781f6d9f471d005d44"
              ],
              "userEmails": [
                "adam.pietrzyk@krakowtraders.pl"
              ],
              "accountDomains": []
            }
          ]),
          expect.arrayContaining([
            "outgoing.job.progress",
            {
              "step": "findResults",
              "sfLeads": 2,
              "sfContacts": 0,
              "sfAccounts": 0,
              "userIds": [
                "5a43ce781f6d9f471d005d44"
              ],
              "userEmails": [
                "adam.pietrzyk@krakowtraders.pl"
              ],
              "accountDomains": []
            }
          ]),
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 70,
              "url": "https://na98.salesforce.com/services/data/v39.0/sobjects/Lead/describe"
            }
          ]),
          [
            "info",
            "outgoing.user.success",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "5a43ce781f6d9f471d005d44",
              "user_email": "adam.pietrzyk@krakowtraders.pl",
              "user_anonymous_id": "salesforce-lead:00Q1I000004WO7uUAG"
            },
            {
              "record": {
                "Company": "Krakow Traders",
                "Website": "krakowtraders.pl",
                "LEAD_RANDOM_PL__c": "Appointment scheduled;Decision maker bought-in;lost;qualified to buy;won",
                "Id": "00Q1I000004WO7uUAG"
              },
              "operation": "update",
              "resource": "Lead"
            }
          ],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "webpayload" }]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asUser": {
                "id": "5a43ce781f6d9f471d005d44",
                "email": "adam.pietrzyk@krakowtraders.pl",
                "anonymous_id": "salesforce-lead:00Q1I000004WO7uUAG"
              },
              "subjectType": "user"
            },
            {
              "salesforce_lead/company": {
                "value": "Krakow Traders",
                "operation": "set"
              },
              "salesforce_lead/website": {
                "value": "krakowtraders.pl",
                "operation": "set"
              },
              "salesforce_lead/id": {
                "value": "00Q1I000004WO7uUAG",
                "operation": "setIfNull"
              }
            }
          ]
        ],
        metrics:[
          ["increment","connector.request",1],
          ["increment","ship.service_api.call",1],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
          ["increment","ship.service_api.call",1]
        ],
        platformApiCalls: []
      };
    });
  });

  it("should update a lead that was previously deleted in salesforce", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        "ignore_deleted_objects": false,
        "lead_synchronized_segments": [
          "59f09bc7f9c5a94af600076d"
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
          },
          {
            "hull": "domain",
            "service": "Website",
            "overwrite": false
          },
          {
            "hull": "company",
            "service": "Company",
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
            "hull": "website",
            "overwrite": false
          }
        ]
      }
    };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Lead");
            })
            .reply(200, { records: [], done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Contact");
            })
            .reply(200, { records: [], done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          const respBody = createSoapEnvelope("createResponse", { result: [{ id: "00Q1I000004WO7uUAG", success: "true" }] });
          nock("https://na98.salesforce.com")
            .post("/services/Soap/u/39.0")
            .reply(200, respBody, { "Content-Type": "text/xml", "sforce-limit-info": "api-usage=500/50000" });

          return scope;
        },
        connector,
        messages: [
          {
            "message_id": "QV5AEkw4A0RJUytDCypYEU4EISE-MD5FU0RQBhYsXUZIUTcZCGhRDk9eIz81IChFGgtTE1FcdRNCEGxcM3UHUQ0Zc3thfWJcQQVRRVt0W1EaH1lcfksGVAofdH5hd21YFgYCQ3v8ysqh4ZFvZhs9XBJLLD5-MzZF",
            "user": {
              "accepts_marketing": false,
              "anonymous_ids": [
                "salesforce:00Q1I000004WHchUAG"
              ],
              "created_at": "2017-12-27T16:46:48Z",
              "domain": "krakowtraders.pl",
              "email": "adam.pietrzyk@krakowtraders.pl",
              "first_name": "Adam",
              "has_password": false,
              "id": "5a43ce781f6d9f471d005d44",
              "is_approved": false,
              "last_name": "Pietrzyk",
              "name": "Adam Pietrzyk",
              "segment_ids": [
                "59f09bc7f9c5a94af600076d"
              ],
              "traits_coconuts": 38,
              "traits_salesforce_lead/email": "adam.pietrzyk@krakowtraders.pl",
              "traits_salesforce_lead/first_name": "Adam",
              "traits_salesforce_lead/id": "00Q1I000004WHchAAA",
              "traits_salesforce_lead/last_name": "Pietrzyk",
              "indexed_at": "2017-12-27T18:15:54+00:00",
              "traits_salesforce_lead/deleted_at": "2018-09-10T16:38:43.000+0000",
              "company": "Krakow Traders"
            },
            "segments": [
              {
                "id": "59f09bc7f9c5a94af600076d",
                "name": "Users signed in last 100 days",
                "type": "users_segment",
                "created_at": "2017-10-25T14:12:23Z",
                "updated_at": "2017-10-25T14:12:23Z"
              }
            ],
            "account": {},
            "account_segments": [],
            "events": [],
            "changes": {
              "user": {
                "traits_coconuts": [
                  null,
                  38
                ]
              },
              "segments": {},
              "account": {},
              "account_segments": {},
              "is_new": false
            }
          }
        ],
        response: { "flow_control": { "type": "next", } },
        // expect.arrayContaining([]),
        logs: [
          ["info", "outgoing.job.start", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "webpayload" }],
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 344,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20FirstName%2C%20LastName%2C%20Email%2C%20Website%2C%20Company%2C%20Id%2C%20ConvertedAccountId%2C%20ConvertedContactId%20FROM%20Lead%20WHERE%20Email%20IN%20('adam.pietrzyk%40krakowtraders.pl')%20OR%20Id%20IN%20('00Q1I000004WHchAAA')%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
            }
          ]),
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 248,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20FirstName%2C%20LastName%2C%20Email%2C%20Id%2C%20AccountId%20FROM%20Contact%20WHERE%20Email%20IN%20('adam.pietrzyk%40krakowtraders.pl')%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
            }
          ]),
          expect.arrayContaining([
            "outgoing.job.progress",
            {
              "step": "findResults",
              "sfLeads": 0,
              "sfContacts": 0,
              "sfAccounts": 0,
              "userIds": [
                "5a43ce781f6d9f471d005d44"
              ],
              "userEmails": [
                "adam.pietrzyk@krakowtraders.pl"
              ],
              "accountDomains": []
            }
          ]),
          expect.arrayContaining([
            "outgoing.job.progress",
            {
              "step": "findResults",
              "sfLeads": 0,
              "sfContacts": 0,
              "sfAccounts": 0,
              "userIds": [
                "5a43ce781f6d9f471d005d44"
              ],
              "userEmails": [
                "adam.pietrzyk@krakowtraders.pl"
              ],
              "accountDomains": []
            }
          ]),
          [
            "info",
            "outgoing.user.success",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_anonymous_id": "salesforce-lead:00Q1I000004WO7uUAG",
              "user_id": "5a43ce781f6d9f471d005d44",
              "user_email": "adam.pietrzyk@krakowtraders.pl"
            },
            {
              record: {
                FirstName: "Adam",
                LastName: "Pietrzyk",
                Email: "adam.pietrzyk@krakowtraders.pl",
                Website: "krakowtraders.pl",
                Company: "Krakow Traders",
                Id: "00Q1I000004WO7uUAG"
              },
              operation: "insert",
              resource: "Lead"
            }
          ],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "webpayload" }]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asUser": {
                "id": "5a43ce781f6d9f471d005d44",
                "email": "adam.pietrzyk@krakowtraders.pl",
                "anonymous_id": "salesforce-lead:00Q1I000004WO7uUAG"
              },
              "subjectType": "user"
            },
            {
              "first_name": {
                "value": "Adam",
                "operation": "setIfNull"
              },
              "salesforce_lead/first_name": {
                "value": "Adam",
                "operation": "set"
              },
              "last_name": {
                "value": "Pietrzyk",
                "operation": "setIfNull"
              },
              "salesforce_lead/last_name": {
                "value": "Pietrzyk",
                "operation": "set"
              },
              "salesforce_lead/company": {
                "value": "Krakow Traders",
                "operation": "set"
              },
              "salesforce_lead/email": {
                "value": "adam.pietrzyk@krakowtraders.pl",
                "operation": "set"
              },
              "salesforce_lead/website": {
                "value": "krakowtraders.pl",
                "operation": "set"
              },
              "salesforce_lead/id": {
                "value": "00Q1I000004WO7uUAG",
                "operation": "setIfNull"
              }
            }
          ]
        ],
        metrics:[
          ["increment","connector.request",1],
          ["increment","ship.service_api.call",1],
          ["increment","ship.service_api.call",1],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500]
        ],
        platformApiCalls: []
      };
    });
  });

  it("should update a lead that was already synced in salesforce", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        "lead_synchronized_segments": [
          "59f09bc7f9c5a94af600076d"
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
          },
          {
            "hull": "domain",
            "service": "Website",
            "overwrite": false
          },
          {
            "hull": "company",
            "service": "Company",
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
            "hull": "website",
            "overwrite": false
          }
        ]
      }
    };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Lead");
            })
            .reply(200, { records: [
                {
                  attributes: {
                    type: "Lead",
                    url: "/services/data/v39.0/sobjects/Lead/00Q1I000004WHchAAA"
                  },
                  Id: "00Q1I000004WHchAAA",
                  Email: "adam.pietrzyk@krakowtraders.pl",
                  FirstName: "Adam",
                  LastName: "Pietrzyk",
                  Status: "Open - Not Contacted"
                },
                {
                  attributes: {
                    type: "Lead",
                    url: "/services/data/v39.0/sobjects/Lead/00K5X000008NAchUAG"
                  },
                  Id: "00K5X000008NAchUAG",
                  Email: "adam.pietrzyk@krakowtraders.pl",
                  FirstName: "Adam",
                  LastName: "This was a test",
                  Status: "Open - Not Contacted"
                }
              ],
              done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Contact");
            })
            .reply(200, { records: [], done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          const respBody = createSoapEnvelope("updateResponse", { result: [{ id: "00Q1I000004WHchAAA", success: "true" }] });
          nock("https://na98.salesforce.com")
            .post("/services/Soap/u/39.0")
            .reply(200, respBody, { "Content-Type": "text/xml", "sforce-limit-info": "api-usage=500/50000" });

          nock("https://na98.salesforce.com")
            .get("/services/data/v39.0/sobjects/Lead/describe")
            .query()
            .reply(200, { fields: [] }, { "sforce-limit-info": "api-usage=500/50000" });

          return scope;
        },
        connector,
        messages: [
          {
            "message_id": "QV5AEkw4A0RJUytDCypYEU4EISE-MD5FU0RQBhYsXUZIUTcZCGhRDk9eIz81IChFGgtTE1FcdRNCEGxcM3UHUQ0Zc3thfWJcQQVRRVt0W1EaH1lcfksGVAofdH5hd21YFgYCQ3v8ysqh4ZFvZhs9XBJLLD5-MzZF",
            "user": {
              "accepts_marketing": false,
              "anonymous_ids": [
                "salesforce:00Q1I000004WHchUAG"
              ],
              "created_at": "2017-12-27T16:46:48Z",
              "domain": "krakowtraders.pl",
              "email": "adam.pietrzyk@krakowtraders.pl",
              "first_name": "Adam",
              "has_password": false,
              "id": "5a43ce781f6d9f471d005d44",
              "is_approved": false,
              "last_name": "Pietrzyk",
              "name": "Adam Pietrzyk",
              "segment_ids": [
                "59f09bc7f9c5a94af600076d"
              ],
              "traits_coconuts": 38,
              "traits_salesforce_lead/email": "adam.pietrzyk@krakowtraders.pl",
              "traits_salesforce_lead/first_name": "Adam",
              "traits_salesforce_lead/id": "00Q1I000004WHchAAA",
              "traits_salesforce_lead/last_name": "Pietrzyk",
              "indexed_at": "2017-12-27T18:15:54+00:00",
              "company": "Krakow Traders"
            },
            "segments": [
              {
                "id": "59f09bc7f9c5a94af600076d",
                "name": "Users signed in last 100 days",
                "type": "users_segment",
                "created_at": "2017-10-25T14:12:23Z",
                "updated_at": "2017-10-25T14:12:23Z"
              }
            ],
            "account": {},
            "account_segments": [],
            "events": [],
            "changes": {
              "user": {
                "traits_coconuts": [
                  null,
                  38
                ]
              },
              "segments": {},
              "account": {},
              "account_segments": {},
              "is_new": false
            }
          }
        ],
        response: { "flow_control": { "type": "next", } },
        logs: [
          ["info", "outgoing.job.start", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "webpayload" }],
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 344,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20FirstName%2C%20LastName%2C%20Email%2C%20Website%2C%20Company%2C%20Id%2C%20ConvertedAccountId%2C%20ConvertedContactId%20FROM%20Lead%20WHERE%20Email%20IN%20('adam.pietrzyk%40krakowtraders.pl')%20OR%20Id%20IN%20('00Q1I000004WHchAAA')%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
            }
          ]),
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 248,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20FirstName%2C%20LastName%2C%20Email%2C%20Id%2C%20AccountId%20FROM%20Contact%20WHERE%20Email%20IN%20('adam.pietrzyk%40krakowtraders.pl')%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
            }
          ]),
          expect.arrayContaining([
            "outgoing.job.progress",
            {
              "step": "findResults",
              "sfLeads": 2,
              "sfContacts": 0,
              "sfAccounts": 0,
              "userIds": [
                "5a43ce781f6d9f471d005d44"
              ],
              "userEmails": [
                "adam.pietrzyk@krakowtraders.pl"
              ],
              "accountDomains": []
            }
          ]),
          expect.arrayContaining([
            "outgoing.job.progress",
            {
              "step": "findResults",
              "sfLeads": 2,
              "sfContacts": 0,
              "sfAccounts": 0,
              "userIds": [
                "5a43ce781f6d9f471d005d44"
              ],
              "userEmails": [
                "adam.pietrzyk@krakowtraders.pl"
              ],
              "accountDomains": []
            }
          ]),
          [
            "info",
            "outgoing.user.success",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "5a43ce781f6d9f471d005d44",
              "user_email": "adam.pietrzyk@krakowtraders.pl",
              "user_anonymous_id": "salesforce-lead:00Q1I000004WHchAAA"
            },
            {
              "record": {
                "Website": "krakowtraders.pl",
                "Company": "Krakow Traders",
                "Id": "00Q1I000004WHchAAA"
              },
              "operation": "update",
              "resource": "Lead"
            }
          ],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "webpayload" }]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asUser": {
                "id": "5a43ce781f6d9f471d005d44",
                "email": "adam.pietrzyk@krakowtraders.pl",
                "anonymous_id": "salesforce-lead:00Q1I000004WHchAAA"
              },
              "subjectType": "user"
            },
            {
              "salesforce_lead/company": {
                "value": "Krakow Traders",
                "operation": "set"
              },
              "salesforce_lead/website": {
                "value": "krakowtraders.pl",
                "operation": "set"
              },
              "salesforce_lead/id": {
                "value": "00Q1I000004WHchAAA",
                "operation": "setIfNull"
              }
            }
          ]
        ],
        metrics:[
          ["increment","connector.request",1],
          ["increment","ship.service_api.call",1],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
          ["increment","ship.service_api.call",1]
        ],
        platformApiCalls: []
      };
    });
  });
})
