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
  lead_claims: [{ "hull": "email", "service": "Email", "required": false }],
  user_claims: [{ "hull": "email", "service": "Email", "required": false }]
}

describe("Insert Contacts Tests", () => {

  it("should batch fail to insert a new contact", () => {
    const connector = {
      private_settings: {
        contact_synchronized_segments: ["contact_segment_1"],
        send_null_values: true,
        contact_attributes_outbound: [
          { hull: "email", service: "Email", overwrite: false },
          { hull: "traits_salesforce_contact/department",
            service: "Department",
            overwrite: true }
        ],
        account_attributes_outbound: [],
        account_claims: [{ hull: "domain", service: "Website", required: true }],
        account_synchronized_segments: ["account_segment_1"],
        ...private_settings
      }
    };
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");
          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Account");
            })
            .reply(200, { records: [], done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Contact");
            })
            .reply(200, { records: [], done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          const respBodyAccount = createSoapEnvelope("updateResponse", { result: [{ id: "00Q1I000004WHchUAA", success: "true" }] });
          nock("https://na98.salesforce.com")
            .post("/services/Soap/u/39.0")
            .reply(200, respBodyAccount, { "Content-Type": "text/xml", "sforce-limit-info": "api-usage=500/50000" });

          const respBody = createSoapEnvelope("updateResponse", { result: [{ id: "00Q1I000004WHchUAG", success: "true" }] });
          nock("https://na98.salesforce.com")
            .post("/services/Soap/u/39.0")
            .reply(400, { "message": "some random error" });
          return scope;
        },
        connector,
        messages: [
          {
            message_id: "1",
            user: {
              anonymous_ids: [],
              email: "adam@apple.com",
              id: "5a43ce781f6d9f471d005d44",
            },
            segments: [{ id: "contact_segment_1" }],
            account: {
              domain: "apple.com",
              id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              name: "Apple",
              "salesforce/description": "description from account"
            },
            account_segments: [{ id: "account_segment_2" }],
            events: [],
            changes: {}
          }

        ],
        response: { "flow_control": { "type": "next", } },
        logs: [
          ["info", "outgoing.job.start", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "webpayload" }],
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 191,
              "url": expect.stringMatching(/.*FROM.*Account.*/)
            }
          ]),
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 248,
              "url": expect.stringMatching(/.*FROM.*Contact.*/)
            }
          ]),
          [
            "info",
            "outgoing.account.success",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "account_domain": "apple.com",
              "account_anonymous_id": "salesforce:00Q1I000004WHchUAA"
            },
            {
              "record": {
                "Website": "apple.com",
                "Id": "00Q1I000004WHchUAA"
              },
              "operation": "insert",
              "resource": "Account"
            }
          ],
          [
            "info",
            "outgoing.user.error",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "5a43ce781f6d9f471d005d44",
              "user_email": "adam@apple.com"
            },
            {
              "error": "Outgoing Batch Error: ERROR_HTTP_400: {\"message\":\"some random error\"}",
              "resourceType": "Contact",
              "warning": "Unable to determine invalid user"
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
                "domain": "apple.com",
                "anonymous_id": "salesforce:00Q1I000004WHchUAA"
              },
              "subjectType": "account"
            },
            {
              "salesforce/id": {
                "value": "00Q1I000004WHchUAA",
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
          ["increment","ship.service_api.call",1]
        ],
        platformApiCalls: []
      };
    });
  });

  it("should insert a new contact and insert a new account", () => {
    const connector = {
      private_settings: {
        contact_synchronized_segments: ["contact_segment_1"],
        send_null_values: true,
        lead_claims: [
          { "hull": "email", "service": "Email"}
        ],
        user_claims: [
          { "hull": "email", "service": "Email"}
        ],
        contact_attributes_outbound: [
          { hull: "traits_salesforce_contact/department",
            service: "Department",
            overwrite: true }
        ],
        account_attributes_outbound: [],
        account_claims: [{ hull: "domain", service: "Website", required: true }],
        account_synchronized_segments: ["account_segment_1"],
        ...private_settings
      }
    };
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");
          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Account");
            })
            .reply(200, { records: [], done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Contact");
            })
            .reply(200, { records: [], done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          const respBodyAccount = createSoapEnvelope("updateResponse", { result: [{ id: "00Q1I000004WHchUAA", success: "true" }] });
          nock("https://na98.salesforce.com")
            .post("/services/Soap/u/39.0")
            .reply(200, respBodyAccount, { "Content-Type": "text/xml", "sforce-limit-info": "api-usage=500/50000" });

          const respBody = createSoapEnvelope("updateResponse", { result: [{ id: "00Q1I000004WHchUAG", success: "true" }] });
          nock("https://na98.salesforce.com")
            .post("/services/Soap/u/39.0")
            .reply(200, respBody, { "Content-Type": "text/xml", "sforce-limit-info": "api-usage=500/50000" });
          return scope;
        },
        connector,
        messages: [
          {
            message_id: "1",
            user: {
              anonymous_ids: [],
              email: "adam@apple.com",
              id: "5a43ce781f6d9f471d005d44",
            },
            segments: [{ id: "contact_segment_1" }],
            account: {
              domain: "apple.com",
              id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              name: "Apple",
              "salesforce/description": "description from account"
            },
            account_segments: [{ id: "account_segment_2" }],
            events: [],
            changes: {}
          }

        ],
        response: { "flow_control": { "type": "next", } },
        logs: [
          ["info", "outgoing.job.start", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "webpayload" }],
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 191,
              "url": expect.stringMatching(/.*FROM.*Account.*/)
            }
          ]),
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 248,
              "url": expect.stringMatching(/.*FROM.*Contact.*/)
            }
          ]),
          [
            "info",
            "outgoing.account.success",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "account_domain": "apple.com",
              "account_anonymous_id": "salesforce:00Q1I000004WHchUAA"
            },
            {
              "record": {
                "Website": "apple.com",
                "Id": "00Q1I000004WHchUAA"
              },
              "operation": "insert",
              "resource": "Account"
            }
          ],
          [
            "info",
            "outgoing.user.success",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "5a43ce781f6d9f471d005d44",
              "user_email": "adam@apple.com",
              "user_anonymous_id": "salesforce-contact:00Q1I000004WHchUAG"
            },
            {
              "record": {
                "Email": "adam@apple.com",
                "AccountId": "00Q1I000004WHchUAA",
                "Id": "00Q1I000004WHchUAG"
              },
              "operation": "insert",
              "resource": "Contact"
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
                "domain": "apple.com",
                "anonymous_id": "salesforce:00Q1I000004WHchUAA"
              },
              "subjectType": "account"
            },
            {
              "salesforce/id": {
                "value": "00Q1I000004WHchUAA",
                "operation": "setIfNull"
              }
            }
          ],
          [
            "traits",
            {
              "asUser": {
                "id": "5a43ce781f6d9f471d005d44",
                "email": "adam@apple.com",
                "anonymous_id": "salesforce-contact:00Q1I000004WHchUAG"
              },
              "subjectType": "user"
            },
            {
              "salesforce_contact/id": {
                "value": "00Q1I000004WHchUAG",
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
          ["increment","ship.service_api.call",1]
        ],
        platformApiCalls: []
      };
    });
  });

  it("should insert a new contact and update an existing account", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        send_null_values: true,
        contact_synchronized_segments: ["59f09bc7f9c5a94af600076d"],
        account_synchronized_segments: [
          "accountSegmentId1",
          "accountSegmentId2"
        ],
        contact_attributes_outbound: [
          {
            hull: "first_name",
            service: "FirstName",
            overwrite: false
          },
          {
            hull: "last_name",
            service: "LastName",
            overwrite: false
          },
          {
            service: "Description",
            hull: "account.employees",
            overwrite: true
          }
        ],
        account_attributes_outbound: [
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
        contact_attributes_inbound: [
          {
            "hull": "traits_salesforce_contact/first_name",
            "service": "FirstName",
            "overwrite": false
          },
          {
            "hull": "salesforce_contact/last_name",
            "service": "LastName",
            "overwrite": false
          },
          {
            "hull": "salesforce_contact/email",
            "service": "Email",
            "overwrite": false
          }
        ],
        account_attributes_inbound: [
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
        account_claims: [{ hull: "domain", service: "Website", required: true }],
        user_claims: [{ hull: "email", service: "C_Email__c", required: true }],
        lead_claims: [{ hull: "email", service: "Email", required: true }]
      }
    };
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");
          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Contact");
            })
            .reply(200, { records: [], done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Account");
            })
            .reply(200, { records: [
                {
                  "Id": "ahfidugi123",
                  "Website": "https://krakowtraders.pl",
                  "Name": "Krakow Traders",
                  "CS_Stage__c": "Pending"
                }
              ], done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          const respBodyC1 = createSoapEnvelope("createResponse", { result: [{ id: "aOuvlns903760", success: "true" }, { id: "aOuvlns903761", success: "true" }] });
          nock("https://na98.salesforce.com")
            .post("/services/Soap/u/39.0", (body) => {
              return body.indexOf("<create><sObjects><type>Contact</type><C_Email__c>adam.pietrzyk@krakowtraders.pl</C_Email__c><FirstName>Adam</FirstName><LastName>Pietrzyk</LastName>") !== -1;
            })
            .reply(200, respBodyC1, { "Content-Type": "text/xml", "sforce-limit-info": "api-usage=500/50000" });

          const respBody = createSoapEnvelope("updateResponse", { result: [{ id: "ahfidugi123", success: "true" }] });
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
            "message_id": "UserUpdateAccountMessage1",
            "user": {
              "accepts_marketing": false,
              "anonymous_ids": [
                "salesforce:00Q1I000004WHchUAG"
              ],
              "created_at": "2017-12-27T16:46:48Z",
              "domain": "krakowtraders.pl",
              "email": "adam.pietrzyk@krakowtraders.pl",
              "first_name": "Adam",
              "id": "5a43ce781f6d9f471d005d44",
              "last_name": "Pietrzyk",
              "name": "Adam Pietrzyk",
              "segment_ids": [
                "59f09bc7f9c5a94af600076d"
              ],
              "traits_coconuts": 38
            },
            "segments": [
              {
                "id": "59f09bc7f9c5a94af600076d",
                "name": "Users signed in last 100 days"
              }
            ],
            "account": {
              "created_at": "2017-10-25T10:06:00Z",
              "domain": "krakowtraders.pl",
              "id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "industry": "Technology",
              "name": "Krakow Traders",
              "mrr": 950,
              "employees": 2,
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
            "message_id": "UserUpdateAccountMessage2",
            "user": {
              "accepts_marketing": false,
              "anonymous_ids": [
                "1496191053-c05dac0f-ad75-479a-8aef-4feff68cfc80"
              ],
              "domain": "krakowtraders.pl",
              "email": "rafa.kasczka@krakowtraders.pl",
              "first_name": "Rafa",
              "last_name": "kasczka",
              "id": "59c975d75226a8c3a6001f40",
              "segment_ids": [
                "59f09bc7f9c5a94af600076d"
              ],
              "traits_company": "Krakow Traders",
            },
            "segments": [
              {
                "id": "59f09bc7f9c5a94af600076d",
                "name": "Users signed in last 100 days"
              }
            ],
            "account": {
              "created_at": "2017-10-25T10:06:00Z",
              "domain": "krakowtraders.pl",
              "id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "industry": "Technology",
              "name": "Krakow Traders",
              "mrr": 950
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
              "user": {
                "traits_coconuts": [null, 45]
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
              "url_length": 237,
              "url": expect.stringMatching(/.*FROM.*Account.*/)
            }
          ]),
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 325,
              "url": expect.stringMatching(/.*FROM.*Contact.*/)
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
              "account_anonymous_id": "salesforce:ahfidugi123"
            },
            {
              "record": {
                "Mrr__c": 950,
                "Id": "ahfidugi123"
              },
              "operation": "update",
              "resource": "Account"
            }
          ],
          [
            "info",
            "outgoing.user.success",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "5a43ce781f6d9f471d005d44",
              "user_email": "adam.pietrzyk@krakowtraders.pl",
              "user_anonymous_id": "salesforce-contact:aOuvlns903760"
            },
            {
              "record": {
                "FirstName": "Adam",
                "LastName": "Pietrzyk",
                "C_Email__c": "adam.pietrzyk@krakowtraders.pl",
                "Description": 2,
                "AccountId": "ahfidugi123",
                "Id": "aOuvlns903760"
              },
              "operation": "insert",
              "resource": "Contact"
            }
          ],
          [
            "info",
            "outgoing.user.success",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "59c975d75226a8c3a6001f40",
              "user_email": "rafa.kasczka@krakowtraders.pl",
              "user_anonymous_id": "salesforce-contact:aOuvlns903761"
            },
            {
              "record": {
                "FirstName": "Rafa",
                "LastName": "kasczka",
                "C_Email__c": "rafa.kasczka@krakowtraders.pl",
                "AccountId": "ahfidugi123",
                "Id": "aOuvlns903761"
              },
              "operation": "insert",
              "resource": "Contact"
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
                "domain": "krakowtraders.pl",
                "anonymous_id": "salesforce:ahfidugi123"
              },
              "subjectType": "account"
            },
            {
              "salesforce/mrr": {
                "value": 950,
                "operation": "set"
              },
              "salesforce/id": {
                "value": "ahfidugi123",
                "operation": "setIfNull"
              }
            }
          ],
          [
            "traits",
            {
              "asUser": {
                "id": "5a43ce781f6d9f471d005d44",
                "email": "adam.pietrzyk@krakowtraders.pl",
                "anonymous_id": "salesforce-contact:aOuvlns903760"
              },
              "subjectType": "user"
            },
            {
              "first_name": {
                "value": "Adam",
                "operation": "setIfNull"
              },
              "salesforce_contact/first_name": {
                "value": "Adam",
                "operation": "set"
              },
              "last_name": {
                "value": "Pietrzyk",
                "operation": "setIfNull"
              },
              "salesforce_contact/last_name": {
                "value": "Pietrzyk",
                "operation": "set"
              },
              "salesforce_contact/id": {
                "value": "aOuvlns903760",
                "operation": "setIfNull"
              }
            }
          ],
          [
            "traits",
            {
              "asUser": {
                "id": "59c975d75226a8c3a6001f40",
                "email": "rafa.kasczka@krakowtraders.pl",
                "anonymous_id": "salesforce-contact:aOuvlns903761"
              },
              "subjectType": "user"
            },
            {
              "first_name": {
                "value": "Rafa",
                "operation": "setIfNull"
              },
              "salesforce_contact/first_name": {
                "value": "Rafa",
                "operation": "set"
              },
              "last_name": {
                "value": "kasczka",
                "operation": "setIfNull"
              },
              "salesforce_contact/last_name": {
                "value": "kasczka",
                "operation": "set"
              },
              "salesforce_contact/id": {
                "value": "aOuvlns903761",
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
          ["increment","ship.service_api.call",1]
        ],

        platformApiCalls: []
      };
    });
  });
});
