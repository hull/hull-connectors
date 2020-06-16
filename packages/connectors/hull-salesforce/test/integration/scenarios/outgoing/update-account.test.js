// @flow
import connectorConfig from "../../../../server/config";

const createSoapEnvelope = require("../../../helper/soapapiopsresponse");
const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";

const private_settings = {
  instance_url: "https://na98.salesforce.com",
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

describe("Update Accounts Tests", () => {

  it("should update a single account (out of 2) that has not been synced with salesforce", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        "account_claims": [
          {
            "hull": "domain",
            "service": "Website",
            "required": true
          },
          {
            "hull": "external_id",
            "service": "CustomIdentifierField",
            "required": true
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
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Account");
            })
            .reply(200, { records: [
                {
                  attributes: {
                    type: "Account",
                    url: "/services/data/v39.0/sobjects/Account/0011I000007Cy18QAC"
                  },
                  Id: "0011I000007Cy18QAC",
                  Website: "http://krakowtraders.pl",
                  Name: "Krakow Trades",
                  Mrr__c: 450,
                  CS_Stage__c: "Pending",
                  CustomIdentifierField: "0011I000007Cy18QAC"
                },
                {
                  attributes: {
                    type: "Account",
                    url: "/services/data/v39.0/sobjects/Account/0011I000007Cy18QAC"
                  },
                  Id: "0012I000007Cy18PBC",
                  Website: "https://krakowtraders.pl",
                  Name: "Krakow Trades",
                  Mrr__c: 450,
                  CS_Stage__c: "Pending",
                  CustomIdentifierField: "0012I000007Cy18PBC"
                }
              ],
              done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          const respBody = createSoapEnvelope("updateResponse", { result: [{ id: "0011I000007Cy18QAC", success: "true" }] });
          nock("https://na98.salesforce.com")
            .post("/services/Soap/u/39.0", (body) => {
              return body.indexOf("<update><sObjects><type>Account</type>") !== -1;
            })
            .reply(200, respBody, { "Content-Type": "text/xml", "sforce-limit-info": "api-usage=500/50000" });

          return scope;
        },
        connector,
        messages: [
          {
            "message_id": "QV5AEkw4A0RJUytDCypYEU4EISE-MD5FU0RQBhYsXUZIUTcZCGhRDk9eIz81IChFGgtTE1FcdRNCEGxcM3UHUQ0Zc3thfWJcQQVRRVt0W1EaH1lcfksGVAofdH5hd21YFgYCQ3v8ysqh4ZFvZhs9XBJLLD5-MzZF",
            "user": {},
            "segments": [],
            "account": {
              "created_at": "2017-10-25T10:06:00Z",
              "domain": "krakowtraders.pl",
              "employees": 2,
              "id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "industry": "Technology",
              "name": "Krakow Traders",
              "plan": "Enterprise",
              "mrr": 950,
              "_sales_business_won": "2017-10-25T12:45:00Z",
              "cs_stage": "Pending",
              "external_id": "0011I000007Cy18QAC"
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
            "message_id": "RUFeQBJMOANESVMrQwsqWBFOBCEhPjA-RVNEUAYWLF1GSFE3GQhoUQ5PXiM_NSAoRRoLUxNRXHYTQhBtM1x1B1ENGHR9aHxpU0IIBEZZfFVbCTxofmJ0AlYLH3d9aXxiUxsAAm3R687h9_RbZhg9XBJLLD5-MzY",
            "user": {},
            "segments": [],
            "account": {
              "created_at": "2017-10-25T10:06:00Z",
              "domain": "krakowtraders.pl",
              "employees": 2,
              "id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "industry": "Technology",
              "name": "Krakow Traders",
              "plan": "Enterprise",
              "mrr": 950,
              "_sales_business_won": "2017-10-25T12:45:00Z",
              "cs_stage": "Pending",
              "external_id": "0011I000007Cy18QAC"
            },
            "account_segments": [
              {
                "id": "accountSegmentId2",
                "name": "accountSegment2",
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
        // expect.arrayContaining([]),
        logs: [
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 323,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Website%2C%20Name%2C%20Mrr__c%2C%20CS_Stage__c%2C%20Id%2C%20CustomIdentifierField%20FROM%20Account%20WHERE%20Website%20LIKE%20'%25krakowtraders.pl%25'%20OR%20CustomIdentifierField%20IN%20('0011I000007Cy18QAC')%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
            }
          ]),
          expect.arrayContaining([
            "outgoing.job.progress",
            {
              "step": "findResults",
              "sfLeads": 0,
              "sfContacts": 0,
              "sfAccounts": 2,
              "userIds": [],
              "userEmails": [],
              "accountDomains": [
                "krakowtraders.pl"
              ]
            }
          ]),
          [
            "info",
            "outgoing.account.success",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "account_external_id": "0011I000007Cy18QAC",
              "account_domain": "krakowtraders.pl",
              "account_anonymous_id": "salesforce:0011I000007Cy18QAC"
            },
            {
              "record": {
                "Mrr__c": 950,
                "Id": "0011I000007Cy18QAC"
              },
              "operation": "update",
              "resource": "Account"
            }
          ]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asAccount": {
                "id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                "external_id": "0011I000007Cy18QAC",
                "domain": "krakowtraders.pl",
                "anonymous_id": "salesforce:0011I000007Cy18QAC"
              },
              "subjectType": "account"
            },
            {
              "salesforce/mrr": {
                "value": 950,
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
          ["value","ship.service_api.remaining",49500],
          ["increment","ship.service_api.call",1]
        ],
        platformApiCalls: []
      };
    });
  });

  it("should update account after initial query to salesforce returns many accounts", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        "account_claims": [
          {
            "hull": "domain",
            "service": "Website",
            "required": true
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
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q === "SELECT Website, Name, Mrr__c, CS_Stage__c, Id FROM Account WHERE Website LIKE '%krakowtraders.pl%' ORDER BY CreatedDate ASC LIMIT 10000";
            })
            .reply(200, { records: [
                {
                  "attributes": {
                    "type": "Account",
                    "url": "/services/data/v39.0/sobjects/Account/9944I000007Cy18QAC"
                  },
                  "Id": "9944I000007Cy18QAC",
                  "Website": "krakowtraderspl",
                  "Name": "krakowtraderspl copy paste",
                  "Mrr__c": 9,
                  "CS_Stage__c": "Pending"
                },
                {
                  "attributes": {
                    "type": "Account",
                    "url": "/services/data/v39.0/sobjects/Account/9966I000007Cy18QAC"
                  },
                  "Id": "9966I000007Cy18QAC",
                  "Website": "ilovekrakowtraders.pl",
                  "Name": "I Love Krakowtraders Fan Club",
                  "Mrr__c": 90,
                  "CS_Stage__c": "Pending"
                },
                {
                  "attributes": {
                    "type": "Account",
                    "url": "/services/data/v39.0/sobjects/Account/9977I000007Cy18QAC"
                  },
                  "Id": "9977I000007Cy18QAC",
                  "Website": "i-breath-krakowtraders.pl",
                  "Name": "I Breath Krakowtraders Fan Club",
                  "Mrr__c": 90,
                  "CS_Stage__c": "Pending"
                },
                {
                  "attributes": {
                    "type": "Account",
                    "url": "/services/data/v39.0/sobjects/Account/0011I000007Cy18QAC"
                  },
                  "Id": "0011I000007Cy18QAC",
                  "Website": "https://krakowtraders.pl",
                  "Name": "Krakow Traders",
                  "Mrr__c": 450,
                  "CS_Stage__c": "Pending"
                }
              ], done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          const respBody = createSoapEnvelope("updateResponse", { result: [{ id: "0011I000007Cy18QAC", success: "true" }] });
          nock("https://na98.salesforce.com")
            .post("/services/Soap/u/39.0", (body) => {
              return body.indexOf("<update><sObjects><type>Account</type>") !== -1;
            })
            .reply(200, respBody, { "Content-Type": "text/xml", "sforce-limit-info": "api-usage=500/50000" });


          return scope;
        },
        connector,
        messages: [
          {
            "message_id": "QV5AEkw4A0RJUytDCypYEU4EISE-MD5FU0RQBhYsXUZIUTcZCGhRDk9eIz81IChFGgtTE1FcdRNCEGxcM3UHUQ0Zc3thfWJcQQVRRVt0W1EaH1lcfksGVAofdH5hd21YFgYCQ3v8ysqh4ZFvZhs9XBJLLD5-MzZF",
            "user": {},
            "segments": [],
            "account": {
              "created_at": "2017-10-25T10:06:00Z",
              "domain": "krakowtraders.pl",
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
            "message_id": "RUFeQBJMOANESVMrQwsqWBFOBCEhPjA-RVNEUAYWLF1GSFE3GQhoUQ5PXiM_NSAoRRoLUxNRXHYTQhBtM1x1B1ENGHR9aHxpU0IIBEZZfFVbCTxofmJ0AlYLH3d9aXxiUxsAAm3R687h9_RbZhg9XBJLLD5-MzY",
            "user": {},
            "segments": [],
            "account": {
              "created_at": "2017-10-25T10:06:00Z",
              "domain": "krakowtraders.pl",
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
                "id": "accountSegmentId2",
                "name": "accountSegment2",
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
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 237,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Website%2C%20Name%2C%20Mrr__c%2C%20CS_Stage__c%2C%20Id%20FROM%20Account%20WHERE%20Website%20LIKE%20'%25krakowtraders.pl%25'%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
            }
          ]),
          expect.arrayContaining([
            "outgoing.job.progress",
            {
              "step": "findResults",
              "sfLeads": 0,
              "sfContacts": 0,
              "sfAccounts": 4,
              "userIds": [],
              "userEmails": [],
              "accountDomains": [
                "krakowtraders.pl"
              ]
            }
          ]),
          [
            "info",
            "outgoing.account.success",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "account_domain": "krakowtraders.pl",
              "account_anonymous_id": "salesforce:0011I000007Cy18QAC"
            },
            {
              "record": {
                "Mrr__c": 950,
                "Id": "0011I000007Cy18QAC"
              },
              "operation": "update",
              "resource": "Account"
            }
          ]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asAccount": {
                "id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                "domain": "krakowtraders.pl",
                "anonymous_id": "salesforce:0011I000007Cy18QAC"
              },
              "subjectType": "account"
            },
            {
              "salesforce/mrr": {
                "value": 950,
                "operation": "set"
              },
              "salesforce/id": {
                "value": "0011I000007Cy18QAC",
                "operation": "setIfNull"
              }
            }
          ]
        ],
        metrics:[
          ["increment","connector.request",1],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
          ["increment","ship.service_api.call",1]
        ],
        platformApiCalls: []
      };
    });
  });

  it("should skip account that cannot be matched with a salesforce account", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        "account_claims": [
          {
            "hull": "domain",
            "service": "Website",
            "required": true
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
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q === "SELECT Website, Name, Mrr__c, CS_Stage__c, Id FROM Account WHERE Website LIKE '%krakowtraders.pl%' ORDER BY CreatedDate ASC LIMIT 10000";
            })
            .reply(200, { records: [
                {
                  attributes: {
                    type: "Account",
                    url: "/services/data/v39.0/sobjects/Account/9922I000007Cy18QAC"
                  },
                  Id: "9922I000007Cy18QAC",
                  Website: "https://apac.krakowtraders.pl",
                  Name: "Krakow Traders Asia Pacific LLC",
                  Mrr__c: 990,
                  CS_Stage__c: "Pending"
                },
                {
                  attributes: {
                    type: "Account",
                    url: "/services/data/v39.0/sobjects/Account/9933I000007Cy18QAC"
                  },
                  Id: "9933I000007Cy18QAC",
                  Website: "/krakowtraders.pl",
                  Name: "Krakow Tr Typos",
                  Mrr__c: 99,
                  CS_Stage__c: "Pending"
                },
                {
                  attributes: {
                    type: "Account",
                    url: "/services/data/v39.0/sobjects/Account/9944I000007Cy18QAC"
                  },
                  Id: "9944I000007Cy18QAC",
                  Website: "krakowtraderspl",
                  Name: "krakowtraderspl copy paste",
                  Mrr__c: 9,
                  CS_Stage__c: "Pending"
                },
                {
                  attributes: {
                    type: "Account",
                    url: "/services/data/v39.0/sobjects/Account/9966I000007Cy18QAC"
                  },
                  Id: "9966I000007Cy18QAC",
                  Website: "ilovekrakowtraders.pl",
                  Name: "I Love Krakowtraders Fan Club",
                  Mrr__c: 90,
                  CS_Stage__c: "Pending"
                },
                {
                  attributes: {
                    type: "Account",
                    url: "/services/data/v39.0/sobjects/Account/9977I000007Cy18QAC"
                  },
                  Id: "9977I000007Cy18QAC",
                  Website: "i-breath-krakowtraders.pl",
                  Name: "I Breath Krakowtraders Fan Club",
                  Mrr__c: 90,
                  CS_Stage__c: "Pending"
                },
                {
                  attributes: {
                    type: "Account",
                    url: "/services/data/v39.0/sobjects/Account/0011I000007Cy18QAC"
                  },
                  Id: "0011I000007Cy18QAC",
                  Website: "https://krakowtraders.pl",
                  Name: "Krakow Traders",
                  Mrr__c: 450,
                  CS_Stage__c: "Pending"
                },
                {
                  attributes: {
                    type: "Account",
                    url: "/services/data/v39.0/sobjects/Account/9988I000007Cy18QAC"
                  },
                  Id: "9988I000007Cy18QAC",
                  Website: "www.krakowtraders.pl",
                  Name: "Krakow Traders Duplicate #1",
                  Mrr__c: 950,
                  CS_Stage__c: "Pending"
                },
                {
                  attributes: {
                    type: "Account",
                    url: "/services/data/v39.0/sobjects/Account/9999I000007Cy18QAC"
                  },
                  Id: "9999I000007Cy18QAC",
                  Website: "http://www.krakowtraders.pl/services",
                  Name: "Krakow Traders Duplicate #2",
                  Mrr__c: 950,
                  CS_Stage__c: "Pending"
                },
                {
                  attributes: {
                    type: "Account",
                    url: "/services/data/v39.0/sobjects/Account/9955I000007Cy18QAC"
                  },
                  Id: "9955I000007Cy18QAC",
                  Website: "krakowtraders.pl/is/the/best",
                  Name: "Krakowtraders.pl is the best",
                  Mrr__c: 900,
                  CS_Stage__c: "Pending"
                }
              ],
              done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          return scope;
        },
        connector,
        messages: [
          {
            "message_id": "QV5AEkw4A0RJUytDCypYEU4EISE-MD5FU0RQBhYsXUZIUTcZCGhRDk9eIz81IChFGgtTE1FcdRNCEGxcM3UHUQ0Zc3thfWJcQQVRRVt0W1EaH1lcfksGVAofdH5hd21YFgYCQ3v8ysqh4ZFvZhs9XBJLLD5-MzZF",
            "user": {},
            "segments": [],
            "account": {
              "created_at": "2017-10-25T10:06:00Z",
              "domain": "krakowtraders.pl",
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
                "name": "accountSegment1"
              },
              {
                "id": "accountSegmentId3",
                "name": "accountSegment3"
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
            "message_id": "RUFeQBJMOANESVMrQwsqWBFOBCEhPjA-RVNEUAYWLF1GSFE3GQhoUQ5PXiM_NSAoRRoLUxNRXHYTQhBtM1x1B1ENGHR9aHxpU0IIBEZZfFVbCTxofmJ0AlYLH3d9aXxiUxsAAm3R687h9_RbZhg9XBJLLD5-MzY",
            "user": {},
            "segments": [],
            "account": {
              "created_at": "2017-10-25T10:06:00Z",
              "domain": "krakowtraders.pl",
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
                "id": "accountSegmentId2",
                "name": "accountSegment2"
              },
              {
                "id": "accountSegmentId3",
                "name": "accountSegment3"
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
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 237,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Website%2C%20Name%2C%20Mrr__c%2C%20CS_Stage__c%2C%20Id%20FROM%20Account%20WHERE%20Website%20LIKE%20'%25krakowtraders.pl%25'%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
            }
          ]),
          expect.arrayContaining([
            "outgoing.job.progress",
            {
              "step": "findResults",
              "sfLeads": 0,
              "sfContacts": 0,
              "sfAccounts": 9,
              "userIds": [],
              "userEmails": [],
              "accountDomains": [
                "krakowtraders.pl"
              ]
            }
          ]),
          [
            "info",
            "outgoing.account.skip",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "account_domain": "krakowtraders.pl"
            },
            {
              "reason": "Cannot determine which salesforce account to update."
            }
          ]
        ],
        firehoseEvents: [],
        metrics:[
          ["increment","connector.request",1],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500]
        ],
        platformApiCalls: []
      };
    });
  });

  it("should update account that has not been synced with salesforce", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        fetch_resource_schema: true,
        "account_claims": [
          {
            "hull": "domain",
            "service": "Website",
            "required": true
          }
        ],
        "account_attributes_outbound": [
          {
            "hull": "account.account_name",
            "service": "ACCOUNT_NAME__c",
            "overwrite": true
          },
          {
            "hull": "outreach/account_stage",
            "service": "ACCOUNT_STAGE__c",
            "overwrite": true
          },
          {
            "hull": "salesforce/account_segments_concat",
            "service": "ACCOUNT_SEGMENTS__c",
            "overwrite": true
          },
          {
            "hull": "salesforce/account_stages",
            "service": "ACCOUNT_STAGES__c",
            "overwrite": true
          },
          {
            "hull": "salesforce/account_random_pl",
            "service": "ACCOUNT_RANDOM_PL__c",
            "overwrite": true
          }
        ],
        "account_attributes_inbound": [
          {
            "service": "Website",
            "hull": "salesforce/website",
            "overwrite": false
          },
          {
            "service": "Name",
            "hull": "salesforce/name",
            "overwrite": false
          },
          {
            "service": "ACCOUNT_STAGE__c",
            "hull": "salesforce/account_stage",
            "overwrite": false
          },
          {
            "service": "Mrr__c",
            "hull": "salesforce/mrr",
            "overwrite": false
          },
          {
            "service": "ACCOUNT_NAME__c",
            "hull": "salesforce/account_name",
            "overwrite": false
          },
          {
            "service": "ACCOUNT_RANDOM_PL__c",
            "hull": "salesforce/account_random_pl",
            "overwrite": false
          }
        ],
        "account_synchronized_segments": ["accountSegmentId1"],
      }
    };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          scope
            .get("/services/data/v39.0/sobjects/Account/describe")
            .query()
            .reply(200, { fields: [
                {
                  name: "ACCOUNT_SEGMENTS__c",
                  picklistValues: [
                    "AcntSegment1",
                    "AcntSegment2",
                  ],
                  type: "multipicklist",
                  unique: false,
                  updateable: true
                },
                {
                  name: "ACCOUNT_STAGES__c",
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
                  name: "ACCOUNT_RANDOM_PL__c",
                  picklistValues: [
                    "Decision maker bought-in",
                    "Appointment scheduled",
                    "Qualified to buy",
                    "Sent",
                    "Won",
                    "Lost"
                  ],
                  type: "picklist",
                  unique: false,
                  updateable: true
                }
              ] }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Account");
            })
            .reply(200, { records: [
                {
                  "attributes": {
                    "type": "Account",
                    "url": "/services/data/v39.0/sobjects/Account/0011I000007Cy18QAC"
                  },
                  "Id": "0011I000007Cy18QAC",
                  "Website": "krakowtraders.pl",
                  "Name": "Krakow Trades",
                  "CS_Stage__c": "Pending",
                  "ACCOUNT_SEGMENTS__c": "ACCOUNTSegment1",
                  "ACCOUNT_STAGES__c": "Open;Closed;PROSPECTing;Promising;Needs Analysis",
                  "ACCOUNT_RANDOM_PL__c": "Appointment scheduled;Qualified to buy;Sent;Won;Lost"
                }
              ], done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          const respBody = createSoapEnvelope("updateResponse", { result: [{ id: "0011I000007Cy18QAC", success: "true" }] });

          nock("https://na98.salesforce.com")
            .post("/services/Soap/u/39.0", (body) => {
              return body.indexOf("<update><sObjects><type>Account</type>") !== -1;
            })
            .reply(200, respBody, { "Content-Type": "text/xml", "sforce-limit-info": "api-usage=500/50000" });

          return scope;
        },
        connector,
        messages: [
          {
            "message_id": "QV5AEkw4A0RJUytDCypYEU4EISE-MD5FU0RQBhYsXUZIUTcZCGhRDk9eIz81IChFGgtTE1FcdRNCEGxcM3UHUQ0Zc3thfWJcQQVRRVt0W1EaH1lcfksGVAofdH5hd21YFgYCQ3v8ysqh4ZFvZhs9XBJLLD5-MzZF",
            "user": {},
            "segments": [],
            "account": {
              "created_at": "2017-10-25T10:06:00Z",
              "domain": "krakowtraders.pl",
              "employees": 2,
              "id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "industry": "Technology",
              "name": "Krakow Traders",
              "account_name": "new name",
              "outreach/account_stage": "new stage",
              "plan": "Enterprise",
              "mrr": 950,
              "_sales_business_won": "2017-10-25T12:45:00Z",
              "cs_stage": "Pending",
              "salesforce/id": "0011I000007Cy18QAC",
              "salesforce/account_segments_concat": "accountsegment1",
              "salesforce/account_stages": [
                "Closed",
                "prospecting",
                "needs analysis",
                "open",
                "Promising"
              ],
              "salesforce/account_random_pl": [
                "Appointment scheduled",
                "qualified to buy",
                "Decision maker bought-in",
                "won",
                "lost"
              ]
            },
            "account_segments": [
              {
                "id": "accountSegmentId1",
                "name": "accountSegment1",
                "updated_at": "2019-04-30T22:00:24Z",
                "type": "accounts_segment",
                "created_at": "2019-04-30T22:00:24Z"
              }
            ],
            "events": [],
            "changes": {
              "user": {},
              "segments": {},
              "account": {
                "account_name": [
                  "old name",
                  "new name"
                ],
                "outreach/account_stage": [
                  "old stage",
                  "new stage"
                ]
              },
              "account_segments": {},
              "is_new": false
            }
          }
        ],
        response: { "flow_control": { "type": "next", } },
        logs: [
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 377,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20ACCOUNT_NAME__c%2C%20ACCOUNT_STAGE__c%2C%20ACCOUNT_SEGMENTS__c%2C%20ACCOUNT_STAGES__c%2C%20ACCOUNT_RANDOM_PL__c%2C%20Id%2C%20Website%2C%20Name%2C%20Mrr__c%20FROM%20Account%20WHERE%20Id%20IN%20('0011I000007Cy18QAC')%20OR%20Website%20LIKE%20'%25krakowtraders.pl%25'%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
            }
          ]),
          expect.arrayContaining([
            "outgoing.job.progress",
            {
              "step": "findResults",
              "sfLeads": 0,
              "sfContacts": 0,
              "sfAccounts": 1,
              "userIds": [],
              "userEmails": [],
              "accountDomains": [
                "krakowtraders.pl"
              ]
            }
          ]),
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 73,
              "url": "https://na98.salesforce.com/services/data/v39.0/sobjects/Account/describe"
            }
          ]),
          [
            "info",
            "outgoing.account.success",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "account_domain": "krakowtraders.pl",
              "account_anonymous_id": "salesforce:0011I000007Cy18QAC"
            },
            {
              "record": {
                "ACCOUNT_NAME__c": "new name",
                "ACCOUNT_STAGE__c": "new stage",
                "ACCOUNT_RANDOM_PL__c": "Appointment scheduled;Decision maker bought-in;lost;qualified to buy;won",
                "Id": "0011I000007Cy18QAC"
              },
              "operation": "update",
              "resource": "Account"
            }
          ]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asAccount": {
                "id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                "domain": "krakowtraders.pl",
                "anonymous_id": "salesforce:0011I000007Cy18QAC"
              },
              "subjectType": "account"
            },
            {
              "salesforce/account_stage": {
                "value": "new stage",
                "operation": "set"
              },
              "salesforce/account_name": {
                "value": "new name",
                "operation": "set"
              },
              "salesforce/account_random_pl": {
                "value": "Appointment scheduled;Decision maker bought-in;lost;qualified to buy;won",
                "operation": "set"
              },
              "salesforce/id": {
                "value": "0011I000007Cy18QAC",
                "operation": "setIfNull"
              }
            }
          ]
        ],
        metrics:[
          ["increment","connector.request",1],
          ["increment","ship.service_api.call",1],
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

  it("should update an account with missing non required account claim", () => {
    const connector = {
      private_settings:{
        ...private_settings,
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
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Account");
            })
            .reply(200, { records: [
                {
                  "attributes": {
                    "type": "Account",
                    "url": "/services/data/v39.0/sobjects/Account/0011I000007Cy18QAC"
                  },
                  "Id": "0011I000007Cy18QAC",
                  "Website": "krakowtraders.pl",
                  "Name": "Krakow Trades",
                  "Mrr__c": 450,
                  "CS_Stage__c": "Pending"
                }
              ], done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          const respBody = createSoapEnvelope("updateResponse", { result: [{ id: "0011I000007Cy18QAC", success: "true" }] });

          nock("https://na98.salesforce.com")
            .post("/services/Soap/u/39.0", (body) => {
              return body.indexOf("<update><sObjects><type>Account</type>") !== -1;
            })
            .reply(200, respBody, { "Content-Type": "text/xml", "sforce-limit-info": "api-usage=500/50000" });


          return scope;
        },
        connector,
        messages: [
          {
            "message_id": "QV5AEkw4A0RJUytDCypYEU4EISE-MD5FU0RQBhYsXUZIUTcZCGhRDk9eIz81IChFGgtTE1FcdRNCEGxcM3UHUQ0Zc3thfWJcQQVRRVt0W1EaH1lcfksGVAofdH5hd21YFgYCQ3v8ysqh4ZFvZhs9XBJLLD5-MzZF",
            "user": {},
            "segments": [],
            "account": {
              "created_at": "2017-10-25T10:06:00Z",
              "domain": "krakowtraders.pl",
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
            "message_id": "RUFeQBJMOANESVMrQwsqWBFOBCEhPjA-RVNEUAYWLF1GSFE3GQhoUQ5PXiM_NSAoRRoLUxNRXHYTQhBtM1x1B1ENGHR9aHxpU0IIBEZZfFVbCTxofmJ0AlYLH3d9aXxiUxsAAm3R687h9_RbZhg9XBJLLD5-MzY",
            "user": {},
            "segments": [],
            "account": {
              "created_at": "2017-10-25T10:06:00Z",
              "domain": "krakowtraders.pl",
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
                "id": "accountSegmentId2",
                "name": "accountSegment2",
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
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 255,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Website%2C%20Name%2C%20Mrr__c%2C%20CS_Stage__c%2C%20Id%2C%20CustomField1%20FROM%20Account%20WHERE%20Website%20LIKE%20'%25krakowtraders.pl%25'%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
            }
          ]),
          expect.arrayContaining([
            "outgoing.job.progress",
            {
              "step": "findResults",
              "sfLeads": 0,
              "sfContacts": 0,
              "sfAccounts": 1,
              "userIds": [],
              "userEmails": [],
              "accountDomains": [
                "krakowtraders.pl"
              ]
            }
          ]),
          [
            "info",
            "outgoing.account.success",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "account_domain": "krakowtraders.pl",
              "account_anonymous_id": "salesforce:0011I000007Cy18QAC"
            },
            {
              "record": {
                "Mrr__c": 950,
                "Id": "0011I000007Cy18QAC"
              },
              "operation": "update",
              "resource": "Account"
            }
          ]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asAccount": {
                "id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                "domain": "krakowtraders.pl",
                "anonymous_id": "salesforce:0011I000007Cy18QAC"
              },
              "subjectType": "account"
            },
            {
              "salesforce/mrr": {
                "value": 950,
                "operation": "set"
              },
              "salesforce/id": {
                "value": "0011I000007Cy18QAC",
                "operation": "setIfNull"
              }
            }
          ]
        ],
        metrics:[
          ["increment","connector.request",1],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
          ["increment","ship.service_api.call",1]
        ],
        platformApiCalls: []
      };
    });
  });

  it("should skip an account with date format discrepancies in salesforce", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        account_attributes_outbound: [
          { service: "KYB_validate_at__c",
            hull: "validated_at",
            overwrite: true },
          { service: "contract_signed_at__c",
            hull: "contract_signed_at",
            overwrite: true },
          { service: "Last_Load_Date__c",
            hull: "last_load_date",
            overwrite: true },
          {
            service: "Description",
            hull: "salesforce/description",
            overwrite: false
          }
        ],
        fetch_accounts: true,
        account_claims: [{ hull: "domain", service: "Website", required: true }],
        account_synchronized_segments: ["account_segment_1"]
      }
    };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q === "SELECT KYB_validate_at__c, contract_signed_at__c, Last_Load_Date__c, Description, Id, Website FROM Account WHERE Website LIKE '%apple.com%' ORDER BY CreatedDate ASC LIMIT 10000";
            })
            .reply(200, { records: [
                {
                  attributes: {
                    type: "Account",
                    url: "/services/data/v39.0/sobjects/Account/0011tAAAAAA"
                  },
                  Id: "0011tAAAAAA",
                  Website: "apple.com",
                  Description: "IT",
                  contract_signed_at__c: "2020-02-10",
                  KYB_validate_at__c: "2017-10-13T13:25:34.000+0000",
                  Last_Load_Date__c: "2020-02-11T08:37:22.000+0000"
                }
              ],
              done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          return scope;
        },
        connector,
        messages: [
          {
            message_id: "1",
            user: {},
            segments: [{ id: "contact_segment_1" }],
            account: {
              anonymous_ids: [
                "salesforce:0011tAAAAAA"
              ],
              domain: "apple.com",
              id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              name: "Apple",
              validated_at: "2017-10-13T13:25:34.000Z",
              contract_signed_at: "2020-02-10T17:12:34.279Z",
              last_load_date: "2020-02-11T08:37:22.000Z",
              "salesforce/description": "IT"
            },
            account_segments: [{ id: "account_segment_1" }],
            events: [],
            changes: {
              user: {},
              segments: {},
              account: {
                "salesforce/description": []
              },
              account_segments: {},
              is_new: false
            }
          }
        ],
        response: { "flow_control": { "type": "next", } },
        // expect.arrayContaining([]),
        logs: [
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 282,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20KYB_validate_at__c%2C%20contract_signed_at__c%2C%20Last_Load_Date__c%2C%20Description%2C%20Id%2C%20Website%20FROM%20Account%20WHERE%20Website%20LIKE%20'%25apple.com%25'%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
            }
          ]),
          expect.arrayContaining([
            "outgoing.job.progress",
            {
              "step": "findResults",
              "sfLeads": 0,
              "sfContacts": 0,
              "sfAccounts": 1,
              "userIds": [],
              "userEmails": [],
              "accountDomains": [
                "apple.com"
              ]
            }
          ]),
          [
            "info",
            "outgoing.account.skip",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "account_domain": "apple.com"
            },
            {
              "reason": "The account in Salesforce is already in sync with Hull."
            }
          ]
        ],
        firehoseEvents: [],
        metrics:[
          ["increment","connector.request",1],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500]
        ],
        platformApiCalls: []
      };
    });
  });

  it("Should update an account that has been synced", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        "lead_synchronized_segments": [],
        "contact_synchronized_segments": [],
        "lead_attributes_outbound": [],
        "contact_attributes_outbound": [],
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
        "lead_attributes_inbound": [],
        "contact_attributes_inbound": [],
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
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Account");
            })
            .reply(200, { records:  [
                {
                  "attributes": {
                    "type": "Account",
                    "url": "/services/data/v39.0/sobjects/Account/0011I000007Cy18QAC"
                  },
                  "Id": "0011I000007Cy18QAC",
                  "Website": "krakowtraders.pl",
                  "Name": "Krakow Trades",
                  "Mrr__c": 450,
                  "CS_Stage__c": "Pending",
                  "CustomField1": "salesforce-id-1"
                }
              ], done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          const respBody = createSoapEnvelope("updateResponse", { result: [{ id: "0011I000007Cy18QAC", success: "true" }] });
          nock("https://na98.salesforce.com")
            .post("/services/Soap/u/39.0", (body) => {
              return body.indexOf("<update><sObjects><type>Account</type>") !== -1;
            })
            .reply(200, respBody, { "Content-Type": "text/xml", "sforce-limit-info": "api-usage=500/50000" });

          return scope;
        },
        connector,
        messages: [
          {
            "message_id": "1",
            "user": {},
            "segments": [],
            "account": {
              "created_at": "2017-10-25T10:06:00Z",
              "domain": "krakowtraders.pl",
              "employees": 2,
              "id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "industry": "Technology",
              "name": "Krakow Traders",
              "plan": "Enterprise",
              "mrr": 950,
              "_sales_business_won": "2017-10-25T12:45:00Z",
              "cs_stage": "Pending",
              "salesforce/id": "0011I000007Cy18QAC",
              "external_id": "salesforce-id-1"
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
              "created_at": "2017-10-25T10:06:00Z",
              "domain": "krakowtraders.pl",
              "employees": 2,
              "id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "industry": "Technology",
              "name": "Krakow Traders",
              "plan": "Enterprise",
              "mrr": 950,
              "_sales_business_won": "2017-10-25T12:45:00Z",
              "cs_stage": "Pending",
              "salesforce/id": "0011I000007Cy18QAC",
              "external_id": "salesforce-id-1"
            },
            "account_segments": [
              {
                "id": "accountSegmentId2",
                "name": "accountSegment2",
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
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 342,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Website%2C%20Name%2C%20Mrr__c%2C%20CS_Stage__c%2C%20Id%2C%20CustomField1%20FROM%20Account%20WHERE%20Id%20IN%20('0011I000007Cy18QAC')%20OR%20Website%20LIKE%20'%25krakowtraders.pl%25'%20OR%20CustomField1%20IN%20('salesforce-id-1')%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
            }
          ]),
          expect.arrayContaining([
            "outgoing.job.progress",
            {
              "step": "findResults",
              "sfLeads": 0,
              "sfContacts": 0,
              "sfAccounts": 1,
              "userIds": [],
              "userEmails": [],
              "accountDomains": [
                "krakowtraders.pl"
              ]
            }
          ]),
          [
            "info",
            "outgoing.account.success",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "account_external_id": "salesforce-id-1",
              "account_domain": "krakowtraders.pl",
              "account_anonymous_id": "salesforce:0011I000007Cy18QAC"
            },
            {
              "record": {
                "Mrr__c": 950,
                "Id": "0011I000007Cy18QAC"
              },
              "operation": "update",
              "resource": "Account"
            }
          ]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asAccount": {
                "id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                "external_id": "salesforce-id-1",
                "domain": "krakowtraders.pl",
                "anonymous_id": "salesforce:0011I000007Cy18QAC"
              },
              "subjectType": "account"
            },
            {
              "salesforce/mrr": {
                "value": 950,
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
          ["value","ship.service_api.remaining",49500],
          ["increment","ship.service_api.call",1]
        ],
        platformApiCalls: []
      };
    });
  });
});
