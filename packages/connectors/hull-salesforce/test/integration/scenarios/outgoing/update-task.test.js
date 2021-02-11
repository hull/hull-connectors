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
  send_outgoing_tasks: true,
  lead_assignmentrule: "none",
  lead_assignmentrule_update: "none",
  contact_claims: [{ hull: "email", service: "Email" }],
  lead_claims: [{ hull: "email", service: "Email" }]
};

describe("Update Tasks Tests", () => {
  it("should update new task and insert new contact", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        source: "salesforce_main",
        lead_synchronized_segments: [],
        contact_synchronized_segments: ["segment_1"],
        account_synchronized_segments: [],
        ignore_users_withoutemail: false,
        ignore_users_withoutchanges: false,
        lead_attributes_outbound: [],
        lead_assignmentrule: "none",
        lead_assignmentrule_update: "none",
        contact_attributes_outbound: [
          {
            hull: "first_name",
            service: "FirstName",
            overwrite: true
          },
          {
            hull: "last_name",
            service: "LastName",
            overwrite: true
          },
          {
            hull: "email",
            service: "Email",
            overwrite: true
          }
        ],
        account_claims: [
          {
            hull: "domain",
            service: "Website",
            required: true
          }
        ],
        account_attributes_outbound: [],
        fetch_accounts: false,
        lead_attributes_inbound: [],
        contact_attributes_inbound: [
          {
            service: "FirstName",
            hull: "salesforce_contact/first_name",
            overwrite: false
          },
          {
            service: "LastName",
            hull: "salesforce_contact/last_name",
            overwrite: false
          },
          {
            service: "Email",
            hull: "salesforce_contact/email",
            overwrite: false
          }
        ],
        account_attributes_inbound: [],
        hull_event_id: "event_id",
        salesforce_external_id: "ExternalEventId__c",
        events_mapping: [
          {
            event: "SENT",
            task_type: "Email"
          },
          {
            event: "Hubspot-Event-4",
            task_type: "Email"
          },
          {
            event: "Hubspot-Event-3",
            task_type: "Email"
          }
        ],
        task_attributes_outbound: [
          {
            hull: "event",
            service: "Subject"
          },
          {
            hull: "properties.emailCampaignId",
            service: "Description"
          },
          {
            hull: "created_at",
            service: "ActivityDate"
          }
        ],
        task_references_outbound: [
          {
            hull: "salesforce_main_contact/id",
            service: "WhoId"
          },
          {
            hull: "salesforce_main_contact/owner_id",
            service: "OwnerId"
          }
        ]
      }
    };
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.notificationHandler,
          handlerUrl: "smart-notifier",
          channel: "user:update",
          externalApiMock: () => {
            const scope = nock("https://na98.salesforce.com");

            scope
              .get("/services/data/v39.0/query")
              .query(query => {
                return query.q && query.q.match("FROM Contact");
              })
              .reply(
                200,
                { records: [], done: true },
                { "sforce-limit-info": "api-usage=500/50000" }
              );

            scope
              .get("/services/data/v39.0/query")
              .query(query => {
                return query.q && query.q.match("FROM Account");
              })
              .reply(
                200,
                {
                  records: [
                    {
                      attributes: {
                        type: "Account"
                      },
                      Id: "ahfidugi123",
                      Website: "https://krakowtraders.pl",
                      Name: "Krakow Traders"
                    }
                  ],
                  done: true
                },
                { "sforce-limit-info": "api-usage=500/50000" }
              );

            scope
              .get("/services/data/v39.0/query")
              .query(query => {
                return query.q && query.q.match("FROM Task");
              })
              .reply(
                200,
                {
                  records: [
                    {
                      WhoId: "1",
                      Subject: "1",
                      Description: "1",
                      ActivityDate: "1",
                      Type: "1",
                      ExternalEventId__c: "hubspot_email_3",
                      Id: "aOuvlns903760"
                    }
                  ]
                },
                { "sforce-limit-info": "api-usage=500/50000" }
              );

            scope
              .get("/services/data/v39.0/sobjects/Task/describe")
              .reply(
                200,
                { records: [] },
                { "sforce-limit-info": "api-usage=500/50000" }
              );

            const contactResponse = createSoapEnvelope("createResponse", {
              result: [{ id: "contact_id_1", success: "true" }]
            });
            nock("https://na98.salesforce.com")
              .post("/services/Soap/u/39.0", body => {
                return (
                  body.indexOf(
                    "<create><sObjects><type>Contact</type><Email>user_1@hull.com</Email><FirstName>Adam</FirstName><LastName>Pietrzyk</LastName><AccountId>ahfidugi123</AccountId></sObjects></create>"
                  ) !== -1
                );
              })
              .reply(200, contactResponse, {
                "Content-Type": "text/xml",
                "sforce-limit-info": "api-usage=500/50000"
              });

            const respBodyC1 = createSoapEnvelope("createResponse", {
              result: [{ id: "asdfasdf", success: "true" }]
            });
            nock("https://na98.salesforce.com")
              .post("/services/Soap/u/39.0", body => {
                return (
                  body.indexOf(
                    "" +
                      "<create>" +
                      "<sObjects>" +
                      "<type>Task</type>" +
                      "<WhoId>contact_id_1</WhoId>" +
                      "<Subject>Hubspot-Event-4</Subject>" +
                      "<Description>837382</Description>" +
                      "<ActivityDate>2019-07-18T20:19:33.000Z</ActivityDate>" +
                      "<Type>Email</Type>" +
                      "<ExternalEventId__c>hubspot_email_4</ExternalEventId__c>" +
                      "</sObjects>" +
                      "</create>"
                  ) !== -1
                );
              })
              .reply(200, respBodyC1, {
                "Content-Type": "text/xml",
                "sforce-limit-info": "api-usage=500/50000"
              });

            const respBodyC2 = createSoapEnvelope("createResponse", {
              result: [{ id: "aOuvlns903760", success: "true" }]
            });
            nock("https://na98.salesforce.com")
              .post("/services/Soap/u/39.0", body => {
                return (
                  body.indexOf(
                    "<update>" +
                      "<sObjects>" +
                      "<type>Task</type>" +
                      "<WhoId>contact_id_1</WhoId>" +
                      "<Subject>Hubspot-Event-3</Subject>" +
                      "<Description>837382</Description>" +
                      "<ActivityDate>2019-07-18T20:19:33.000Z</ActivityDate>" +
                      "<Type>Email</Type>" +
                      "<ExternalEventId__c>hubspot_email_3</ExternalEventId__c>" +
                      "<Id>aOuvlns903760</Id>" +
                      "</sObjects>" +
                      "</update>"
                  ) !== -1
                );
              })
              .reply(200, respBodyC2, {
                "Content-Type": "text/xml",
                "sforce-limit-info": "api-usage=500/50000"
              });
            return scope;
          },
          connector,
          messages: [
            {
              message_id: 1,
              user: {
                domain: "krakowtraders.pl",
                email: "user_1@hull.com",
                first_name: "Adam",
                last_name: "Pietrzyk",
                name: "Adam Pietrzyk",
                id: "user_id_1",
                coconuts: 38,
                anonymous_ids: []
              },
              segments: [
                {
                  id: "segment_1"
                }
              ],
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
                cs_stage: "Pending"
              },
              account_segments: [],
              events: [
                {
                  event: "Hubspot-Event-3",
                  event_id: "hubspot_email_3",
                  user_id: "user_id_1",
                  created_at: "2019-07-18T20:19:33Z",
                  properties: {
                    emailCampaignId: "837382",
                    created: "1563746708853"
                  },
                  event_source: "hubspot",
                  context: {}
                },
                {
                  event: "random event",
                  event_id: "random_event_2",
                  user_id: "user_id_1",
                  created_at: "2019-07-18T20:19:33Z",
                  properties: {
                    emailCampaignId: "837382",
                    created: "1563746708853"
                  },
                  event_source: "random_source",
                  context: {}
                },
                {
                  event: "Hubspot-Event-4",
                  event_id: "hubspot_email_4",
                  user_id: "user_id_1",
                  created_at: "2019-07-18T20:19:33Z",
                  properties: {
                    emailCampaignId: "837382",
                    created: "1563746708853"
                  },
                  event_source: "hubspot",
                  context: {}
                }
              ],
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
                url_length: 198,
                url: expect.stringMatching(/.*FROM.*Account.*/)
              }
            ]),
            expect.arrayContaining([
              "ship.service_api.request",
              {
                method: "GET",
                url_length: 233,
                url: expect.stringMatching(/.*FROM.*Contact.*/)
              }
            ]),
            [
              "info",
              "outgoing.user.success",
              {
                subject_type: "user",
                request_id: expect.whatever(),
                user_id: "user_id_1",
                user_email: "user_1@hull.com",
                user_anonymous_id: "salesforce_main-contact:contact_id_1"
              },
              {
                record: {
                  FirstName: "Adam",
                  LastName: "Pietrzyk",
                  Email: "user_1@hull.com",
                  AccountId: "ahfidugi123",
                  Id: "contact_id_1"
                },
                operation: "insert",
                resource: "Contact"
              }
            ],
            expect.arrayContaining([
              "ship.service_api.request",
              {
                method: "GET",
                url_length: 70,
                url:
                  "https://na98.salesforce.com/services/data/v39.0/sobjects/Task/describe"
              }
            ]),
            expect.arrayContaining([
              "ship.service_api.request",
              {
                method: "GET",
                url_length: 158,
                url:
                  "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20%20FROM%20Task%20WHERE%20ExternalEventId__c%20IN%20('hubspot_email_3'%2C%20'hubspot_email_4')"
              }
            ]),
            [
              "info",
              "outgoing.event.success",
              {
                subject_type: "user",
                request_id: expect.whatever(),
                user_id: "user_id_1",
                user_email: "user_1@hull.com"
              },
              {
                records: [
                  {
                    method: "insert",
                    resource: "Task",
                    record: {
                      WhoId: "contact_id_1",
                      Subject: "Hubspot-Event-4",
                      Description: "837382",
                      ActivityDate: "2019-07-18T20:19:33.000Z",
                      Type: "Email",
                      ExternalEventId__c: "hubspot_email_4",
                      Id: "asdfasdf"
                    },
                    error: null,
                    success: true
                  },
                  {
                    method: "update",
                    resource: "Task",
                    record: {
                      WhoId: "contact_id_1",
                      Subject: "Hubspot-Event-3",
                      Description: "837382",
                      ActivityDate: "2019-07-18T20:19:33.000Z",
                      Type: "Email",
                      ExternalEventId__c: "hubspot_email_3",
                      Id: "aOuvlns903760"
                    },
                    error: null,
                    success: true
                  }
                ]
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
                asUser: {
                  id: "user_id_1",
                  email: "user_1@hull.com",
                  anonymous_id: "salesforce_main-contact:contact_id_1"
                },
                subjectType: "user"
              },
              {
                "salesforce_main_contact/id": {
                  value: "contact_id_1",
                  operation: "setIfNull"
                }
              }
            ]
          ],
          metrics: [
            ["increment", "connector.request", 1],
            ["increment", "ship.service_api.call", 1],
            ["increment", "ship.service_api.call", 1],
            ["value", "ship.service_api.limit", 50000],
            ["value", "ship.service_api.remaining", 49500],
            ["value", "ship.service_api.limit", 50000],
            ["value", "ship.service_api.remaining", 49500],
            ["increment", "ship.service_api.call", 1],
            ["increment", "ship.service_api.call", 1],
            ["value", "ship.service_api.limit", 50000],
            ["value", "ship.service_api.remaining", 49500],
            ["increment", "ship.service_api.call", 1],
            ["value", "ship.service_api.limit", 50000],
            ["value", "ship.service_api.remaining", 49500],
            ["increment", "ship.service_api.call", 1],
            ["increment", "ship.service_api.call", 1]
          ],
          platformApiCalls: []
        };
      }
    );
  });
});
