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
  account_synchronized_segments: [],
  user_claims: [
    { "hull": "email", "service": "Email" }
  ],
  lead_claims: [
    { "hull": "email", "service": "Email" }
  ]
}

describe("Skip User Tests", () => {

  it("should skip a user that is in not in either lead or contact segments", () => {
    const connector = {
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
        externalApiMock: () => {},
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
              "traits_salesforce_lead/id": "00Q1I000004WHchUAG",
              "traits_salesforce_lead/last_name": "Pietrzyk",
              "indexed_at": "2017-12-27T18:15:54+00:00"
            },
            "segments": [],
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
          },
          {
            "message_id": "adsfsdf",
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
              "id": "randomid",
              "is_approved": false,
              "last_name": "Pietrzyk",
              "name": "Adam Pietrzyk",
              "segment_ids": [
                "59f09bc7f9c5a94af600076d"
              ],
              "traits_coconuts": 38,
              "traits_salesforce_lead/email": "adam.pietrzyk@krakowtraders.pl",
              "traits_salesforce_lead/first_name": "Adam",
              "traits_salesforce_lead/id": "00Q1I000004WHchUAG",
              "traits_salesforce_lead/last_name": "Pietrzyk",
              "indexed_at": "2017-12-27T18:15:54+00:00"
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
        logs: [],
        firehoseEvents: [],
        metrics:[
          ["increment", "connector.request", 1]
        ],
        platformApiCalls: []
      };
    });
  });

  it("should skip a user that is in both lead and contact segments", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        "lead_synchronized_segments": [
          "59f09bc7f9c5a94af600076d"
        ],
        "contact_synchronized_segments": [
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
              "traits_salesforce_lead/last_name": "Pietrzyk",
              "indexed_at": "2017-12-27T18:15:54+00:00",
              "traits_salesforce_contact/id": "0031I000004SLT5QAO"
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
              "url_length": 304,
              "url": expect.stringMatching(/.*FROM.*Lead.*/)
            }
          ]),
          [
            "info",
            "outgoing.user.skip",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "5a43ce781f6d9f471d005d44",
              "user_email": "adam.pietrzyk@krakowtraders.pl"
            },
            {
              "reason": "User was synced as a contact from SFDC before, cannot be in a lead segment. Please check your configuration"
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

  it("should skip a lead that has been deleted", () => {
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
              "traits_salesforce_lead/deleted_at": "2018-09-10T16:38:43.000+0000"
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
              "url_length": 304,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20FirstName%2C%20LastName%2C%20Email%2C%20Id%2C%20ConvertedAccountId%2C%20ConvertedContactId%2C%20Company%2C%20Website%20FROM%20Lead%20WHERE%20Email%20IN%20('adam.pietrzyk%40krakowtraders.pl')%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
            }
          ]),
          [
            "info",
            "outgoing.user.skip",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "5a43ce781f6d9f471d005d44",
              "user_email": "adam.pietrzyk@krakowtraders.pl"
            },
            {
              "reason": "Lead has been manually deleted in Salesforce."
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
