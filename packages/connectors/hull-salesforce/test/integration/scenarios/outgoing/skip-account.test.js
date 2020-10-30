import connectorConfig from "../../../../server/config";

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

describe("Skip Account Tests", () => {

  it("should skip an account with a missing required identity claim", () => {
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
              "salesforce/id": "0011I000007Cy18QAC"
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
              "salesforce/id": "0011I000007Cy18QAC"
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
          ["info", "outgoing.job.start", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "webpayload" }],
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 295,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Website%2C%20Name%2C%20Mrr__c%2C%20CS_Stage__c%2C%20Id%2C%20CustomField1%20FROM%20Account%20WHERE%20Id%20IN%20('0011I000007Cy18QAC')%20OR%20Website%20LIKE%20'%25krakowtraders.pl%25'%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
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
              "reason": "Missing required unique identifier in Hull."
            }
          ],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "webpayload" }]
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

  it("should skip an account with too short a domain", () => {
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
              return query.q === "SELECT Website, Name, Mrr__c, CS_Stage__c, Id FROM Account WHERE Website = 'a.com' ORDER BY CreatedDate ASC LIMIT 10000";
            })
            .reply(200, { records: [], done: true }, { "sforce-limit-info": "api-usage=500/50000" });
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
              "domain": "a.com",
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
              "domain": "a.com",
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
          ["info", "outgoing.job.start", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "webpayload" }],
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 219,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Website%2C%20Name%2C%20Mrr__c%2C%20CS_Stage__c%2C%20Id%20FROM%20Account%20WHERE%20Website%20%3D%20'a.com'%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
            }
          ]),
          [
            "info",
            "outgoing.account.skip",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "account_domain": "a.com"
            },
            {
              "reason": "The domain is too short to perform find on SFDC API, we tried exact match but didn't find any record"
            }
          ],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "webpayload" }]
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

});
