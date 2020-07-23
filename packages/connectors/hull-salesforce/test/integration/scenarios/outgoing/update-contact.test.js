// @flow
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
  lead_assignmentrule_update: "none"
}


describe("Update Contacts Tests", () => {

  it("should update with null attributes", () => {
    const connector = {
      private_settings: {
        send_null_values: true,
        contact_synchronized_segments: ["contact_segment_1"],
        contact_attributes_outbound: [
          { hull: "email", service: "Email", overwrite: false },
          { hull: "traits_salesforce_contact/department",
            service: "Department",
            overwrite: true },
          { hull: "traits_salesforce_contact/description",
            service: "",
            overwrite: true },
          { hull: "",
            service: "About",
            overwrite: true },
          { hull: "account.salesforce/description",
            service: "Description",
            overwrite: true }],
        account_attributes_outbound: [],
        account_claims: [{ hull: "domain", service: "Website", required: true }],
        account_synchronized_segments: ["account_segment_1"],
        ...private_settings
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
              return query.q && query.q.match("FROM Account");
            })
            .reply(200, { records: [], done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q === "SELECT Email, Department, About, Description, FirstName, LastName, Id, AccountId FROM Contact WHERE Email IN ('adam@apple.com') OR Id IN ('00Q1I000004WHchUAG') ORDER BY CreatedDate ASC LIMIT 10000";
            })
            .reply(200, { records: [
                {
                  attributes: {
                    type: "Contact",
                    url: "/services/data/v39.0/sobjects/Contact/00Q1I000004WHchUAG"
                  },
                  Id: "00Q1I000004WHchUAG",
                  Email: "adam@apple.com",
                  FirstName: "Adam",
                  LastName: "P",
                  Company: "Apple",
                  Website: "apple.com",
                  Department: "Marketing"
                }
              ],
              done: true }, { "sforce-limit-info": "api-usage=500/50000" });

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
              anonymous_ids: [
                "salesforce-contact:00Q1I000004WHchUAG"
              ],
              "traits_salesforce_contact/description": "description",
              "traits_salesforce_contact/id": "00Q1I000004WHchUAG",
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
            account_segments: [{ id: "account_segment_2" }]
          }
        ],
        response: { "flow_control": { "type": "next", } },
        logs: [
          ["info", "outgoing.job.start", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "webpayload" }],
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 262,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Email%2C%20FirstName%2C%20LastName%2C%20Id%2C%20ConvertedAccountId%2C%20ConvertedContactId%20FROM%20Lead%20WHERE%20Email%20IN%20('adam%40apple.com')%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
            }
          ]),
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 316,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Email%2C%20Department%2C%20About%2C%20Description%2C%20FirstName%2C%20LastName%2C%20Id%2C%20AccountId%20FROM%20Contact%20WHERE%20Email%20IN%20('adam%40apple.com')%20OR%20Id%20IN%20('00Q1I000004WHchUAG')%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
            }
          ]),
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 191,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Id%2C%20Website%20FROM%20Account%20WHERE%20Website%20LIKE%20'%25apple.com%25'%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
            }
          ]),
          expect.arrayContaining([
            "outgoing.job.progress",
            {
              "step": "findResults",
              "sfLeads": 0,
              "sfContacts": 1,
              "sfAccounts": 0,
              "userIds": [
                "5a43ce781f6d9f471d005d44"
              ],
              "userEmails": [
                "adam@apple.com"
              ],
              "accountDomains": [
                "apple.com"
              ]
            }
          ]),
          expect.arrayContaining([
            "outgoing.job.progress",
            {
              "step": "findResults",
              "sfLeads": 0,
              "sfContacts": 1,
              "sfAccounts": 0,
              "userIds": [
                "5a43ce781f6d9f471d005d44"
              ],
              "userEmails": [
                "adam@apple.com"
              ],
              "accountDomains": [
                "apple.com"
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
                "fieldsToNull": [
                  "Department"
                ],
                "Description": "description from account",
                "AccountId": "00Q1I000004WHchUAA",
                "Id": "00Q1I000004WHchUAG"
              },
              "operation": "update",
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
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
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

  it("should update new contact and insert new acount", () => {
    const connector = {
      private_settings: {
        account_claims: [{ hull: "domain", service: "Website", required: true }],
        lead_synchronized_segments: [],
        contact_synchronized_segments: ["contact_segment_1"],
        account_synchronized_segments: ["account_segment_1"],
        lead_attributes_outbound: [],
        contact_attributes_outbound: [
          { hull: "email", service: "Email", overwrite: false },
          { hull: "salesforce_contact/department",
            service: "Department",
            overwrite: false },
          { hull: "account.salesforce/description",
            service: "Description",
            overwrite: true }
        ],
        account_attributes_outbound: [],
        lead_attributes_inbound: [
          { service: "OwnerId",
            hull: "salesforce_lead/owner_id",
            overwrite: false },
          { service: "Owner.Email",
            hull: "salesforce_lead/owner_email",
            overwrite: false }
        ],
        contact_attributes_inbound: [
          { service: "Owner.Email",
            hull: "salesforce_contact/owner_email",
            overwrite: false }
        ],
        account_attributes_inbound: [],
        ...private_settings
      }
    };
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          scope.get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q === "SELECT Email, FirstName, LastName, Id, ConvertedAccountId, ConvertedContactId, OwnerId, Owner.Email FROM Lead WHERE Email IN ('adam@apple.com') ORDER BY CreatedDate ASC LIMIT 10000";
            })
            .reply(200, { records: [], done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          scope.get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q === "SELECT Id, Website FROM Account WHERE Website LIKE '%apple.com%' ORDER BY CreatedDate ASC LIMIT 10000";
            })
            .reply(200, { records: [], done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          scope.get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q === "SELECT Email, Department, Description, FirstName, LastName, Id, AccountId, Owner.Email FROM Contact WHERE Email IN ('adam@apple.com') OR Id IN ('00Q1I000004WHchUAG') ORDER BY CreatedDate ASC LIMIT 10000";
            })
            .reply(200, { records: [
                {
                  attributes: {
                    type: "Contact",
                    url: "/services/data/v39.0/sobjects/Contact/00Q1I000004WHchUAG"
                  },
                  Id: "00Q1I000004WHchUAG",
                  OwnerId: "10Q1I000004WHchOWNER",
                  Email: "adam@apple.com",
                  FirstName: "Adam",
                  LastName: "P",
                  Company: "Apple",
                  Website: "apple.com",
                  Owner: {
                    attributes: {
                      type: "User",
                      url: "/services/data/v39.0/sobjects/User/0054P000008CIowQAG"
                    },
                    Email: "owner@hull.io"
                  }
                },
              ],
              done: true }, { "sforce-limit-info": "api-usage=500/50000" });

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
              anonymous_ids: [
                "salesforce-contact:00Q1I000004WHchUAG"
              ],
              "salesforce_contact/id": "00Q1I000004WHchUAG",
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
            changes: {
              user: {},
              segments: {},
              account: {
                "salesforce/description": [
                  "old",
                  "description from account"
                ]
              },
              account_segments: {},
              is_new: false
            }
          }
        ],
        response: {
          "flow_control": {
            "in": 5,
            "in_time": 10,
            "size": 10,
            "type": "next",
          }
        },
        logs: [
          ["info", "outgoing.job.start", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "webpayload" }],
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 292,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Email%2C%20FirstName%2C%20LastName%2C%20Id%2C%20ConvertedAccountId%2C%20ConvertedContactId%2C%20OwnerId%2C%20Owner.Email%20FROM%20Lead%20WHERE%20Email%20IN%20('adam%40apple.com')%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
            }
          ]),
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 322,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Email%2C%20Department%2C%20Description%2C%20FirstName%2C%20LastName%2C%20Id%2C%20AccountId%2C%20Owner.Email%20FROM%20Contact%20WHERE%20Email%20IN%20('adam%40apple.com')%20OR%20Id%20IN%20('00Q1I000004WHchUAG')%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
            }
          ]),
          expect.arrayContaining([
            "ship.service_api.request",
            {
              "method": "GET",
              "url_length": 191,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Id%2C%20Website%20FROM%20Account%20WHERE%20Website%20LIKE%20'%25apple.com%25'%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
            }
          ]),
          expect.arrayContaining([
            "outgoing.job.progress"
          ]),
          expect.arrayContaining([
            "outgoing.job.progress"
          ]),
          ["info", "outgoing.account.success",
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
                "Description": "description from account",
                "AccountId": "00Q1I000004WHchUAA",
                "Id": "00Q1I000004WHchUAG"
              },
              "operation": "update",
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
          ["increment", "connector.request", 1],
          ["increment", "ship.service_api.call", 1],
          ["increment", "ship.service_api.call", 1],
          ["increment", "ship.service_api.call", 1],
          ["value", "ship.service_api.limit", 50000],
          ["value", "ship.service_api.remaining", 49500],
          ["value", "ship.service_api.limit", 50000],
          ["value", "ship.service_api.remaining", 49500],
          ["value", "ship.service_api.limit", 50000],
          ["value", "ship.service_api.remaining", 49500],
          ["increment", "ship.service_api.call", 1],
          ["increment", "ship.service_api.call", 1]
        ],
        platformApiCalls: []
      };
    });
  });
});
