// @flow
import connectorConfig from "../../../../server/config";
import manifest from "../../../../manifest.json";
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
};

describe("Insert Accounts Tests", () => {
  it("should insert an account with missing non required account claims (multiple messages, but single passes filter)", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        account_claims: [
          {
            hull: "domain",
            service: "Website",
            required: false
          }
        ],
        account_attributes_outbound: [
          {
            hull: "domain",
            service: "Website",
            overwrite: true
          },
          {
            hull: "name",
            service: "Name",
            overwrite: false
          },
          {
            hull: "mrr",
            service: "Mrr__c",
            overwrite: true
          },
          {
            hull: "cs_stage",
            service: "CS_Stage__c",
            overwrite: true
          }
        ],
        account_attributes_inbound: [
          {
            hull: "salesforce/website",
            service: "Website",
            overwrite: true
          },
          {
            hull: "salesforce/name",
            service: "Name",
            overwrite: true
          },
          {
            hull: "salesforce/mrr",
            service: "Mrr__c",
            overwrite: true
          }
        ],
        account_synchronized_segments: [
          "accountSegmentId1",
          "accountSegmentId2"
        ]
      }
    };
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.notificationHandler,
          handlerUrl: "smart-notifier",
          channel: "account:update",
          externalApiMock: () => {
            const scope = nock("https://na98.salesforce.com");

            const respBody = createSoapEnvelope("createResponse", {
              result: [{ id: "0011I000007Cy18QAC", success: "true" }]
            });
            nock("https://na98.salesforce.com")
              .post("/services/Soap/u/39.0", body => {
                return (
                  body.indexOf("<create><sObjects><type>Account</type>") !== -1
                );
              })
              .reply(200, respBody, {
                "Content-Type": "text/xml",
                "sforce-limit-info": "api-usage=500/50000"
              });

            return scope;
          },
          connector,
          messages: [
            {
              message_id: "1",
              user: {},
              segments: [],
              account: {
                external_id: "0011I000007Cy18QAC",
                created_at: "2017-10-25T10:06:00Z",
                employees: 2,
                id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                industry: "Technology",
                name: "Krakow Traders",
                plan: "Enterprise",
                mrr: 950,
                _sales_business_won: "2017-10-25T12:45:00Z",
                cs_stage: "Pending"
              },
              account_segments: [
                {
                  id: "accountSegmentId1",
                  name: "accountSegment1",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                },
                {
                  id: "accountSegmentId3",
                  name: "accountSegment3",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                }
              ],
              events: [],
              changes: {
                user: {},
                segments: {},
                account: {},
                account_segments: {},
                is_new: false
              }
            },
            {
              message_id: "2",
              user: {},
              segments: [],
              account: {
                external_id: "0011I000007Cy18QAC-2",
                created_at: "2017-10-25T10:06:00Z",
                employees: 2,
                id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9-2",
                industry: "Technology",
                name: "Krakow Traders",
                plan: "Enterprise",
                mrr: 950,
                _sales_business_won: "2017-10-25T12:45:00Z",
                cs_stage: "Pending"
              },
              account_segments: [
                {
                  id: "accountSegmentId3",
                  name: "accountSegment3",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                }
              ],
              events: [],
              changes: {
                user: {},
                segments: {},
                account: {},
                account_segments: {},
                is_new: false
              }
            }
          ],
          response: { flow_control: { type: "next" } },
          logs: [
            [
              "info",
              "outgoing.job.start",
              { request_id: expect.whatever() },
              { jobName: "Outgoing Data", type: "webpayload" }
            ],
            [
              "info",
              "outgoing.account.success",
              {
                subject_type: "account",
                request_id: expect.whatever(),
                account_external_id: "0011I000007Cy18QAC",
                account_id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                account_anonymous_id: "salesforce:0011I000007Cy18QAC"
              },
              {
                record: {
                  Name: "Krakow Traders",
                  Mrr__c: 950,
                  CS_Stage__c: "Pending",
                  Id: "0011I000007Cy18QAC"
                },
                operation: "insert",
                resource: "Account"
              }
            ],
            [
              "info",
              "outgoing.job.success",
              { request_id: expect.whatever() },
              { jobName: "Outgoing Data", type: "webpayload" }
            ]
          ],
          firehoseEvents: [
            [
              "traits",
              {
                asAccount: {
                  anonymous_id: "salesforce:0011I000007Cy18QAC",
                  external_id: "0011I000007Cy18QAC",
                  id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9"
                },
                subjectType: "account"
              },
              {
                "salesforce/id": {
                  value: "0011I000007Cy18QAC",
                  operation: "setIfNull"
                }
              }
            ]
          ],
          metrics: [
            ["increment", "connector.request", 1],
            ["increment", "ship.service_api.call", 1]
          ],
          platformApiCalls: []
        };
      }
    );
  });

  /*it("should synchronously insert accounts with missing non required account claims (multiple messages)", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        "send_synchronous_account": true,
        "account_claims": [
          {
            "hull": "domain",
            "service": "Website",
            "required": false
          }
        ],
        "account_attributes_outbound": [
          {
            "hull": "domain",
            "service": "Website",
            "overwrite": true
          },
          {
            "hull": "name",
            "service": "Name",
            "overwrite": false
          },
          {
            "hull": "mrr",
            "service": "Mrr__c",
            "overwrite": true
          },
          {
            "hull": "cs_stage",
            "service": "CS_Stage__c",
            "overwrite": true
          }
        ],
        "account_attributes_inbound": [
          {
            "hull": "salesforce/website",
            "service": "Website",
            "overwrite": true
          },
          {
            "hull": "salesforce/name",
            "service": "Name",
            "overwrite": true
          },
          {
            "hull": "salesforce/mrr",
            "service": "Mrr__c",
            "overwrite": true
          }
        ],
        "account_synchronized_segments": [
          "accountSegmentId1",
          "accountSegmentId2"
        ]
      }
    };
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          const respBody = createSoapEnvelope("createResponse", { result: [{ id: "0011I000007Cy18QAC", success: "true" }] });
          nock("https://na98.salesforce.com")
            .post("/services/Soap/u/39.0", (body) => {
              return body.indexOf("<create><sObjects><type>Account</type>") !== -1;
            })
            .reply(200, respBody, { "Content-Type": "text/xml", "sforce-limit-info": "api-usage=500/50000" });

          const respBody2 = createSoapEnvelope("createResponse", { result: [{ id: "0011I000007Cy18QAC-2", success: "true" }] });
          nock("https://na98.salesforce.com")
            .post("/services/Soap/u/39.0", (body) => {
              return body.indexOf("<create><sObjects><type>Account</type>") !== -1;
            })
            .reply(200, respBody2, { "Content-Type": "text/xml", "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Account");
            })
            .reply(200, { records: [], done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          const respBody3 = createSoapEnvelope("createResponse", { result: [{ id: "0011I000007Cy18QAC-3", success: "true" }] });
          nock("https://na98.salesforce.com")
            .post("/services/Soap/u/39.0", (body) => {
              return body.indexOf("<create><sObjects><type>Account</type>") !== -1;
            })
            .reply(200, respBody3, { "Content-Type": "text/xml", "sforce-limit-info": "api-usage=500/50000" });

          return scope;
        },
        connector,
        messages: [
          {
            "message_id": "1",
            "user": {},
            "segments": [],
            "account": {
              "external_id": "0011I000007Cy18QAC",
              "created_at": "2017-10-25T10:06:00Z",
              "employees": 2,
              "id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "industry": "Technology",
              "name": "Krakow Traders",
              "plan": "Enterprise",
              "mrr": 950,
              "_sales_business_won": "2017-10-25T12:45:00Z",
              "cs_stage": "Pending"
            },
            "account_segments": [
              {
                "id": "accountSegmentId1",
                "name": "accountSegment1",
                "updated_at": "2019-04-30T22:00:24Z",
                "type": "accounts_segment",
                "created_at": "2019-04-30T22:00:24Z"
              },
              {
                "id": "accountSegmentId3",
                "name": "accountSegment3",
                "updated_at": "2019-04-30T22:00:24Z",
                "type": "accounts_segment",
                "created_at": "2019-04-30T22:00:24Z"
              }
            ],
            "events": [],
            "changes": {
              "user": {},
              "segments": {},
              "account": {},
              "account_segments": {},
              "is_new": false
            }
          },
          {
            "message_id": "2",
            "user": {},
            "segments": [],
            "account": {
              "external_id": "0011I000007Cy18QAC-2",
              "created_at": "2017-10-25T10:06:00Z",
              "employees": 2,
              "id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9-2",
              "industry": "Technology",
              "name": "Krakow Traders",
              "plan": "Enterprise",
              "mrr": 950,
              "_sales_business_won": "2017-10-25T12:45:00Z",
              "cs_stage": "Pending"
            },
            "account_segments": [
              {
                "id": "accountSegmentId1",
                "name": "accountSegment1",
                "updated_at": "2019-04-30T22:00:24Z",
                "type": "accounts_segment",
                "created_at": "2019-04-30T22:00:24Z"
              },
              {
                "id": "accountSegmentId3",
                "name": "accountSegment3",
                "updated_at": "2019-04-30T22:00:24Z",
                "type": "accounts_segment",
                "created_at": "2019-04-30T22:00:24Z"
              }
            ],
            "events": [],
            "changes": {
              "user": {},
              "segments": {},
              "account": {},
              "account_segments": {},
              "is_new": false
            }
          },
          {
            "message_id": "3",
            "user": {},
            "segments": [],
            "account": {
              "external_id": "0011I000007Cy18QAC-3",
              "domain": "rei.com",
              "created_at": "2017-10-25T10:06:00Z",
              "employees": 2,
              "id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9-3",
              "industry": "Technology",
              "name": "Krakow Traders",
              "plan": "Enterprise",
              "mrr": 950,
              "_sales_business_won": "2017-10-25T12:45:00Z",
              "cs_stage": "Pending"
            },
            "account_segments": [
              {
                "id": "accountSegmentId1",
                "name": "accountSegment1",
                "updated_at": "2019-04-30T22:00:24Z",
                "type": "accounts_segment",
                "created_at": "2019-04-30T22:00:24Z"
              },
              {
                "id": "accountSegmentId3",
                "name": "accountSegment3",
                "updated_at": "2019-04-30T22:00:24Z",
                "type": "accounts_segment",
                "created_at": "2019-04-30T22:00:24Z"
              }
            ],
            "events": [],
            "changes": {
              "user": {},
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
          [
            "info",
            "outgoing.account.success",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "account_external_id": "0011I000007Cy18QAC",
              "account_anonymous_id": "salesforce:0011I000007Cy18QAC"
            },
            {
              "record": {
                "Name": "Krakow Traders",
                "Mrr__c": 950,
                "CS_Stage__c": "Pending",
                "Id": "0011I000007Cy18QAC"
              },
              "operation": "insert",
              "resource": "Account"
            }
          ],
          [
            "info",
            "outgoing.account.success",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9-2",
              "account_external_id": "0011I000007Cy18QAC-2",
              "account_anonymous_id": "salesforce:0011I000007Cy18QAC-2"
            },
            {
              "record": {
                "Name": "Krakow Traders",
                "Mrr__c": 950,
                "CS_Stage__c": "Pending",
                "Id": "0011I000007Cy18QAC-2"
              },
              "operation": "insert",
              "resource": "Account"
            }
          ],
          expect.arrayContaining(["ship.service_api.request"]),
          [
            "info",
            "outgoing.account.success",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_domain": "rei.com",
              "account_id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9-3",
              "account_external_id": "0011I000007Cy18QAC-3",
              "account_anonymous_id": "salesforce:0011I000007Cy18QAC-3"
            },
            {
              "record": {
                "Name": "Krakow Traders",
                "Mrr__c": 950,
                "CS_Stage__c": "Pending",
                "Id": "0011I000007Cy18QAC-3",
                "Website": "rei.com"
              },
              "operation": "insert",
              "resource": "Account"
            }
          ],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "webpayload" }]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asAccount": {
                "id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                "external_id": "0011I000007Cy18QAC",
                "anonymous_id": "salesforce:0011I000007Cy18QAC"
              },
              "subjectType": "account"
            },
            {
              "name": {
                "value": "Krakow Traders",
                "operation": "setIfNull"
              },
              "salesforce/name": {
                "value": "Krakow Traders",
                "operation": "set"
              },
              "salesforce/mrr": {
                "value": 950,
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
                "id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9-2",
                "external_id": "0011I000007Cy18QAC-2",
                "anonymous_id": "salesforce:0011I000007Cy18QAC-2"
              },
              "subjectType": "account"
            },
            {
              "name": {
                "value": "Krakow Traders",
                "operation": "setIfNull"
              },
              "salesforce/name": {
                "value": "Krakow Traders",
                "operation": "set"
              },
              "salesforce/mrr": {
                "value": 950,
                "operation": "set"
              },
              "salesforce/id": {
                "value": "0011I000007Cy18QAC-2",
                "operation": "setIfNull"
              }
            }
          ],
          [
            "traits",
            {
              "asAccount": {
                "id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9-3",
                "external_id": "0011I000007Cy18QAC-3",
                "anonymous_id": "salesforce:0011I000007Cy18QAC-3",
                "domain": "rei.com"
              },
              "subjectType": "account"
            },
            {
              "domain": {
                "operation": "setIfNull",
                "value": "rei.com"
              },
              "name": {
                "value": "Krakow Traders",
                "operation": "setIfNull"
              },
              "salesforce/name": {
                "value": "Krakow Traders",
                "operation": "set"
              },
              "salesforce/mrr": {
                "value": 950,
                "operation": "set"
              },
              "salesforce/website": {
                "operation": "set",
                "value": "rei.com"
              },
              "salesforce/id": {
                "value": "0011I000007Cy18QAC-3",
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
          ["increment","ship.service_api.call",1]
        ],
        platformApiCalls: []
      };
    });
  });*/

  it("should not insert an account with missing required account claims (multiple messages)", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        account_claims: [
          {
            hull: "domain",
            service: "Website",
            required: true
          }
        ],
        account_attributes_outbound: [
          {
            hull: "domain",
            service: "Website",
            overwrite: true
          },
          {
            hull: "name",
            service: "Name",
            overwrite: false
          },
          {
            hull: "mrr",
            service: "Mrr__c",
            overwrite: true
          },
          {
            hull: "cs_stage",
            service: "CS_Stage__c",
            overwrite: true
          }
        ],
        account_attributes_inbound: [
          {
            hull: "salesforce/website",
            service: "Website",
            overwrite: true
          },
          {
            hull: "salesforce/name",
            service: "Name",
            overwrite: true
          },
          {
            hull: "salesforce/mrr",
            service: "Mrr__c",
            overwrite: true
          }
        ],
        account_synchronized_segments: [
          "accountSegmentId1",
          "accountSegmentId2"
        ]
      }
    };
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.notificationHandler,
          handlerUrl: "smart-notifier",
          channel: "account:update",
          externalApiMock: () => {
            const scope = nock("https://na98.salesforce.com");

            const respBody = createSoapEnvelope("createResponse", {
              result: [
                { id: "0011I000007Cy18QAC", success: "true" },
                { id: "0011I000007Cy18QAC-2", success: "true" }
              ]
            });
            nock("https://na98.salesforce.com")
              .post("/services/Soap/u/39.0", body => {
                return (
                  body.indexOf("<create><sObjects><type>Account</type>") !== -1
                );
              })
              .reply(200, respBody, {
                "Content-Type": "text/xml",
                "sforce-limit-info": "api-usage=500/50000"
              });

            return scope;
          },
          connector,
          messages: [
            {
              message_id: "1",
              user: {},
              segments: [],
              account: {
                external_id: "0011I000007Cy18QAC",
                created_at: "2017-10-25T10:06:00Z",
                employees: 2,
                id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                industry: "Technology",
                name: "Krakow Traders",
                plan: "Enterprise",
                mrr: 950,
                _sales_business_won: "2017-10-25T12:45:00Z",
                cs_stage: "Pending"
              },
              account_segments: [
                {
                  id: "accountSegmentId1",
                  name: "accountSegment1",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                },
                {
                  id: "accountSegmentId3",
                  name: "accountSegment3",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                }
              ],
              events: [],
              changes: {
                user: {},
                segments: {},
                account: {},
                account_segments: {},
                is_new: false
              }
            },
            {
              message_id: "2",
              user: {},
              segments: [],
              account: {
                external_id: "0011I000007Cy18QAC-2",
                created_at: "2017-10-25T10:06:00Z",
                employees: 2,
                id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9-2",
                industry: "Technology",
                name: "Krakow Traders",
                plan: "Enterprise",
                mrr: 950,
                _sales_business_won: "2017-10-25T12:45:00Z",
                cs_stage: "Pending"
              },
              account_segments: [
                {
                  id: "accountSegmentId1",
                  name: "accountSegment1",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                },
                {
                  id: "accountSegmentId3",
                  name: "accountSegment3",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                }
              ],
              events: [],
              changes: {
                user: {},
                segments: {},
                account: {},
                account_segments: {},
                is_new: false
              }
            }
          ],
          response: { flow_control: { type: "next" } },
          logs: [
            [
              "info",
              "outgoing.job.start",
              { request_id: expect.whatever() },
              { jobName: "Outgoing Data", type: "webpayload" }
            ],
            [
              "info",
              "outgoing.account.skip",
              {
                subject_type: "account",
                request_id: expect.whatever(),
                account_external_id: "0011I000007Cy18QAC",
                account_id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9"
              },
              {
                reason: "Missing required unique identifier in Hull."
              }
            ],
            [
              "info",
              "outgoing.account.skip",
              {
                subject_type: "account",
                request_id: expect.whatever(),
                account_external_id: "0011I000007Cy18QAC-2",
                account_id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9-2"
              },
              {
                reason: "Missing required unique identifier in Hull."
              }
            ],
            [
              "info",
              "outgoing.job.success",
              { request_id: expect.whatever() },
              { jobName: "Outgoing Data", type: "webpayload" }
            ]
          ],
          firehoseEvents: [],
          metrics: [["increment", "connector.request", 1]],
          platformApiCalls: []
        };
      }
    );
  });

  it("should bulk insert accounts with missing non required account claims (multiple messages)", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        account_claims: [
          {
            hull: "domain",
            service: "Website",
            required: false
          }
        ],
        account_attributes_outbound: [
          {
            hull: "domain",
            service: "Website",
            overwrite: true
          },
          {
            hull: "name",
            service: "Name",
            overwrite: false
          },
          {
            hull: "mrr",
            service: "Mrr__c",
            overwrite: true
          },
          {
            hull: "cs_stage",
            service: "CS_Stage__c",
            overwrite: true
          }
        ],
        account_attributes_inbound: [
          {
            hull: "salesforce/website",
            service: "Website",
            overwrite: true
          },
          {
            hull: "salesforce/name",
            service: "Name",
            overwrite: true
          },
          {
            hull: "salesforce/mrr",
            service: "Mrr__c",
            overwrite: true
          }
        ],
        account_synchronized_segments: [
          "accountSegmentId1",
          "accountSegmentId2"
        ]
      }
    };
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.notificationHandler,
          handlerUrl: "smart-notifier",
          channel: "account:update",
          externalApiMock: () => {
            const scope = nock("https://na98.salesforce.com");

            const respBody = createSoapEnvelope("createResponse", {
              result: [
                { id: "0011I000007Cy18QAC", success: "true" },
                { id: "0011I000007Cy18QAC-2", success: "true" }
              ]
            });
            nock("https://na98.salesforce.com")
              .post("/services/Soap/u/39.0", body => {
                return (
                  body.indexOf("<create><sObjects><type>Account</type>") !== -1
                );
              })
              .reply(200, respBody, {
                "Content-Type": "text/xml",
                "sforce-limit-info": "api-usage=500/50000"
              });

            return scope;
          },
          connector,
          messages: [
            {
              message_id: "1",
              user: {},
              segments: [],
              account: {
                external_id: "0011I000007Cy18QAC",
                created_at: "2017-10-25T10:06:00Z",
                employees: 2,
                id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                industry: "Technology",
                name: "Krakow Traders",
                plan: "Enterprise",
                mrr: 950,
                _sales_business_won: "2017-10-25T12:45:00Z",
                cs_stage: "Pending"
              },
              account_segments: [
                {
                  id: "accountSegmentId1",
                  name: "accountSegment1",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                },
                {
                  id: "accountSegmentId3",
                  name: "accountSegment3",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                }
              ],
              events: [],
              changes: {
                user: {},
                segments: {},
                account: {},
                account_segments: {},
                is_new: false
              }
            },
            {
              message_id: "2",
              user: {},
              segments: [],
              account: {
                external_id: "0011I000007Cy18QAC-2",
                created_at: "2017-10-25T10:06:00Z",
                employees: 2,
                id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9-2",
                industry: "Technology",
                name: "Krakow Traders",
                plan: "Enterprise",
                mrr: 950,
                _sales_business_won: "2017-10-25T12:45:00Z",
                cs_stage: "Pending"
              },
              account_segments: [
                {
                  id: "accountSegmentId1",
                  name: "accountSegment1",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                },
                {
                  id: "accountSegmentId3",
                  name: "accountSegment3",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                }
              ],
              events: [],
              changes: {
                user: {},
                segments: {},
                account: {},
                account_segments: {},
                is_new: false
              }
            }
          ],
          response: { flow_control: { type: "next" } },
          logs: [
            [
              "info",
              "outgoing.job.start",
              { request_id: expect.whatever() },
              { jobName: "Outgoing Data", type: "webpayload" }
            ],
            [
              "info",
              "outgoing.account.success",
              {
                subject_type: "account",
                request_id: expect.whatever(),
                account_anonymous_id: "salesforce:0011I000007Cy18QAC"
              },
              {
                record: {
                  Name: "Krakow Traders",
                  Mrr__c: 950,
                  CS_Stage__c: "Pending",
                  Id: "0011I000007Cy18QAC"
                },
                operation: "insert",
                resource: "Account"
              }
            ],
            [
              "info",
              "outgoing.account.success",
              {
                subject_type: "account",
                request_id: expect.whatever(),
                account_anonymous_id: "salesforce:0011I000007Cy18QAC-2"
              },
              {
                record: {
                  Name: "Krakow Traders",
                  Mrr__c: 950,
                  CS_Stage__c: "Pending",
                  Id: "0011I000007Cy18QAC-2"
                },
                operation: "insert",
                resource: "Account"
              }
            ],
            [
              "info",
              "outgoing.job.success",
              { request_id: expect.whatever() },
              { jobName: "Outgoing Data", type: "webpayload" }
            ]
          ],
          firehoseEvents: [
            [
              "traits",
              {
                asAccount: {
                  anonymous_id: "salesforce:0011I000007Cy18QAC"
                },
                subjectType: "account"
              },
              {
                "salesforce/id": {
                  value: "0011I000007Cy18QAC",
                  operation: "setIfNull"
                }
              }
            ],
            [
              "traits",
              {
                asAccount: {
                  anonymous_id: "salesforce:0011I000007Cy18QAC-2"
                },
                subjectType: "account"
              },
              {
                "salesforce/id": {
                  value: "0011I000007Cy18QAC-2",
                  operation: "setIfNull"
                }
              }
            ]
          ],
          metrics: [
            ["increment", "connector.request", 1],
            ["increment", "ship.service_api.call", 1]
          ],
          platformApiCalls: []
        };
      }
    );
  });

  it("should insert an account with missing non required account claims (single message)", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        account_claims: [
          {
            hull: "domain",
            service: "Website",
            required: false
          }
        ],
        account_attributes_outbound: [
          {
            hull: "domain",
            service: "Website",
            overwrite: true
          },
          {
            hull: "name",
            service: "Name",
            overwrite: false
          },
          {
            hull: "mrr",
            service: "Mrr__c",
            overwrite: true
          },
          {
            hull: "cs_stage",
            service: "CS_Stage__c",
            overwrite: true
          }
        ],
        account_attributes_inbound: [
          {
            hull: "salesforce/website",
            service: "Website",
            overwrite: true
          },
          {
            hull: "salesforce/name",
            service: "Name",
            overwrite: true
          },
          {
            hull: "salesforce/mrr",
            service: "Mrr__c",
            overwrite: true
          }
        ],
        account_synchronized_segments: [
          "accountSegmentId1",
          "accountSegmentId2"
        ]
      }
    };
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.notificationHandler,
          handlerUrl: "smart-notifier",
          channel: "account:update",
          externalApiMock: () => {
            const scope = nock("https://na98.salesforce.com");

            const respBody = createSoapEnvelope("createResponse", {
              result: [{ id: "0011I000007Cy18QAC", success: "true" }]
            });
            nock("https://na98.salesforce.com")
              .post("/services/Soap/u/39.0", body => {
                return (
                  body.indexOf("<create><sObjects><type>Account</type>") !== -1
                );
              })
              .reply(200, respBody, {
                "Content-Type": "text/xml",
                "sforce-limit-info": "api-usage=500/50000"
              });

            return scope;
          },
          connector,
          messages: [
            {
              message_id:
                "QV5AEkw4A0RJUytDCypYEU4EISE-MD5FU0RQBhYsXUZIUTcZCGhRDk9eIz81IChFGgtTE1FcdRNCEGxcM3UHUQ0Zc3thfWJcQQVRRVt0W1EaH1lcfksGVAofdH5hd21YFgYCQ3v8ysqh4ZFvZhs9XBJLLD5-MzZF",
              user: {},
              segments: [],
              account: {
                external_id: "0011I000007Cy18QAC",
                created_at: "2017-10-25T10:06:00Z",
                employees: 2,
                id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                industry: "Technology",
                name: "Krakow Traders",
                plan: "Enterprise",
                mrr: 950,
                _sales_business_won: "2017-10-25T12:45:00Z",
                cs_stage: "Pending"
              },
              account_segments: [
                {
                  id: "accountSegmentId1",
                  name: "accountSegment1",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                },
                {
                  id: "accountSegmentId3",
                  name: "accountSegment3",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                }
              ],
              events: [],
              changes: {
                user: {},
                segments: {},
                account: {},
                account_segments: {},
                is_new: false
              }
            }
          ],
          response: { flow_control: { type: "next" } },
          logs: [
            [
              "info",
              "outgoing.job.start",
              { request_id: expect.whatever() },
              { jobName: "Outgoing Data", type: "webpayload" }
            ],
            [
              "info",
              "outgoing.account.success",
              {
                subject_type: "account",
                request_id: expect.whatever(),
                account_id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                account_external_id: "0011I000007Cy18QAC",
                account_anonymous_id: "salesforce:0011I000007Cy18QAC"
              },
              {
                record: {
                  Name: "Krakow Traders",
                  Mrr__c: 950,
                  CS_Stage__c: "Pending",
                  Id: "0011I000007Cy18QAC"
                },
                operation: "insert",
                resource: "Account"
              }
            ],
            [
              "info",
              "outgoing.job.success",
              { request_id: expect.whatever() },
              { jobName: "Outgoing Data", type: "webpayload" }
            ]
          ],
          firehoseEvents: [
            [
              "traits",
              {
                asAccount: {
                  id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                  external_id: "0011I000007Cy18QAC",
                  anonymous_id: "salesforce:0011I000007Cy18QAC"
                },
                subjectType: "account"
              },
              {
                "salesforce/id": {
                  value: "0011I000007Cy18QAC",
                  operation: "setIfNull"
                }
              }
            ]
          ],
          metrics: [
            ["increment", "connector.request", 1],
            ["increment", "ship.service_api.call", 1]
          ],
          platformApiCalls: []
        };
      }
    );
  });

  it("should insert an account", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        account_claims: [
          {
            hull: "external_id",
            service: "CustomIdentifierField",
            required: true
          },
          {
            hull: "domain",
            service: "Website",
            required: true
          }
        ],
        account_attributes_outbound: [
          {
            hull: "domain",
            service: "Website",
            overwrite: true
          },
          {
            hull: "name",
            service: "Name",
            overwrite: false
          },
          {
            hull: "mrr",
            service: "Mrr__c",
            overwrite: true
          },
          {
            hull: "cs_stage",
            service: "CS_Stage__c",
            overwrite: true
          }
        ],
        account_attributes_inbound: [
          {
            hull: "salesforce/website",
            service: "Website",
            overwrite: true
          },
          {
            hull: "salesforce/name",
            service: "Name",
            overwrite: true
          },
          {
            hull: "salesforce/mrr",
            service: "Mrr__c",
            overwrite: true
          }
        ],
        account_synchronized_segments: [
          "accountSegmentId1",
          "accountSegmentId2"
        ]
      }
    };
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.notificationHandler,
          handlerUrl: "smart-notifier",
          channel: "account:update",
          externalApiMock: () => {
            const scope = nock("https://na98.salesforce.com");

            scope
              .get("/services/data/v39.0/query")
              .query(query => {
                return query.q && query.q.match("FROM Account");
              })
              .reply(
                200,
                { records: [], done: true },
                { "sforce-limit-info": "api-usage=500/50000" }
              );

            const respBody = createSoapEnvelope("createResponse", {
              result: [{ id: "0011I000007Cy18QAC", success: "true" }]
            });
            nock("https://na98.salesforce.com")
              .post("/services/Soap/u/39.0", body => {
                return (
                  body.indexOf("<create><sObjects><type>Account</type>") !== -1
                );
              })
              .reply(200, respBody, {
                "Content-Type": "text/xml",
                "sforce-limit-info": "api-usage=500/50000"
              });

            return scope;
          },
          connector,
          messages: [
            {
              message_id:
                "QV5AEkw4A0RJUytDCypYEU4EISE-MD5FU0RQBhYsXUZIUTcZCGhRDk9eIz81IChFGgtTE1FcdRNCEGxcM3UHUQ0Zc3thfWJcQQVRRVt0W1EaH1lcfksGVAofdH5hd21YFgYCQ3v8ysqh4ZFvZhs9XBJLLD5-MzZF",
              user: {},
              segments: [],
              account: {
                created_at: "2017-10-25T10:06:00Z",
                domain: "krakowtraders.pl",
                employees: 2,
                id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                industry: "Technology",
                name: "Krakow Traders",
                plan: "Enterprise",
                mrr: 950,
                _sales_business_won: "2017-10-25T12:45:00Z",
                cs_stage: "Pending",
                external_id: "0011I000007Cy18QAC"
              },
              account_segments: [
                {
                  id: "accountSegmentId1",
                  name: "accountSegment1",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                },
                {
                  id: "accountSegmentId3",
                  name: "accountSegment3",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                }
              ],
              events: [],
              changes: {
                user: {},
                segments: {},
                account: {},
                account_segments: {},
                is_new: false
              }
            },
            {
              message_id:
                "RUFeQBJMOANESVMrQwsqWBFOBCEhPjA-RVNEUAYWLF1GSFE3GQhoUQ5PXiM_NSAoRRoLUxNRXHYTQhBtM1x1B1ENGHR9aHxpU0IIBEZZfFVbCTxofmJ0AlYLH3d9aXxiUxsAAm3R687h9_RbZhg9XBJLLD5-MzY",
              user: {},
              segments: [],
              account: {
                created_at: "2017-10-25T10:06:00Z",
                domain: "krakowtraders.pl",
                employees: 2,
                id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                industry: "Technology",
                name: "Krakow Traders",
                plan: "Enterprise",
                mrr: 950,
                _sales_business_won: "2017-10-25T12:45:00Z",
                cs_stage: "Pending",
                external_id: "0011I000007Cy18QAC"
              },
              account_segments: [
                {
                  id: "accountSegmentId2",
                  name: "accountSegment2",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                },
                {
                  id: "accountSegmentId3",
                  name: "accountSegment3",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                }
              ],
              events: [],
              changes: {
                user: {},
                segments: {},
                account: {},
                account_segments: {},
                is_new: false
              }
            }
          ],
          response: { flow_control: { type: "next" } },
          logs: [
            [
              "info",
              "outgoing.job.start",
              { request_id: expect.whatever() },
              { jobName: "Outgoing Data", type: "webpayload" }
            ],
            expect.arrayContaining([
              "ship.service_api.request",
              {
                method: "GET",
                url_length: 323,
                url:
                  "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Website%2C%20Name%2C%20Mrr__c%2C%20CS_Stage__c%2C%20Id%2C%20CustomIdentifierField%20FROM%20Account%20WHERE%20CustomIdentifierField%20IN%20('0011I000007Cy18QAC')%20OR%20Website%20LIKE%20'%25krakowtraders.pl%25'%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
              }
            ]),
            [
              "info",
              "outgoing.account.success",
              {
                subject_type: "account",
                request_id: expect.whatever(),
                account_id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                account_external_id: "0011I000007Cy18QAC",
                account_domain: "krakowtraders.pl",
                account_anonymous_id: "salesforce:0011I000007Cy18QAC"
              },
              {
                record: {
                  Website: "krakowtraders.pl",
                  Name: "Krakow Traders",
                  Mrr__c: 950,
                  CS_Stage__c: "Pending",
                  CustomIdentifierField: "0011I000007Cy18QAC",
                  Id: "0011I000007Cy18QAC"
                },
                operation: "insert",
                resource: "Account"
              }
            ],
            [
              "info",
              "outgoing.job.success",
              { request_id: expect.whatever() },
              { jobName: "Outgoing Data", type: "webpayload" }
            ]
          ],
          firehoseEvents: [
            [
              "traits",
              {
                asAccount: {
                  id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                  external_id: "0011I000007Cy18QAC",
                  domain: "krakowtraders.pl",
                  anonymous_id: "salesforce:0011I000007Cy18QAC"
                },
                subjectType: "account"
              },
              {
                "salesforce/id": {
                  value: "0011I000007Cy18QAC",
                  operation: "setIfNull"
                }
              }
            ]
          ],
          metrics: [
            ["increment", "connector.request", 1],
            ["increment", "ship.service_api.call", 1],
            ["value", "ship.service_api.limit", 50000],
            ["value", "ship.service_api.remaining", 49500],
            ["increment", "ship.service_api.call", 1]
          ],
          platformApiCalls: []
        };
      }
    );
  });
});
