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

describe("Insert Tasks Tests", () => {
  it("should insert new tasks on existing contact", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        lead_attributes_inbound: [],
        contact_attributes_inbound: [],
        account_attributes_inbound: [],
        lead_attributes_outbound: [],
        contact_attributes_outbound: [],
        account_attributes_outbound: [],
        account_claims: [
          {
            hull: "domain",
            service: "Website",
            required: true
          }
        ],
        contact_synchronized_segments: ["segment_1"],
        hull_event_id: "event_id",
        salesforce_external_id: "ExternalEventId__c",
        events_mapping: [
          { event: "SENT", task_type: "Email" },
          { event: "Hubspot-Event-4", task_type: "Email" },
          { event: "Hubspot-Event-3", task_type: "Email" }
        ],
        task_attributes_outbound: [
          { hull: "event", service: "Subject" },
          { hull: "properties.emailCampaignId", service: "Description" },
          { hull: "created_at", service: "ActivityDate" }
        ],
        task_references_outbound: [
          { hull: "salesforce_contact/id", service: "WhoId" },
          { hull: "salesforce_contact/owner_id", service: "OwnerId" }
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
                {
                  records: [
                    {
                      attributes: {
                        type: "Contact",
                        url:
                          "/services/data/v39.0/sobjects/Contact/contact_id_1"
                      },
                      Id: "contact_id_1",
                      Email: "becci.blankenshield@adventure-works.com",
                      FirstName: "Becci",
                      LastName: "Blankenshield",
                      Company: "Adventure Works",
                      Website: "https://krakowtraders.pl",
                      Status: "Open - Not Contacted"
                    }
                  ],
                  done: true
                },
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
                { records: [] },
                { "sforce-limit-info": "api-usage=500/50000" }
              );

            scope
              .get("/services/data/v39.0/sobjects/Task/describe")
              .reply(
                200,
                { records: [] },
                { "sforce-limit-info": "api-usage=500/50000" }
              );

            const respBodyC1 = createSoapEnvelope("createResponse", {
              result: [
                { id: "aOuvlns903760", success: "true" },
                { id: "asdfasdf", success: "true" }
              ]
            });
            nock("https://na98.salesforce.com")
              .post("/services/Soap/u/39.0", body => {
                return (
                  body.indexOf(
                    "<create><sObjects><type>Task</type><WhoId>contact_id_1</WhoId><Subject>Hubspot-Event-3</Subject><Description>837382</Description><ActivityDate>2019-07-18T20:19:33.000Z</ActivityDate><Type>Email</Type><ExternalEventId__c>hubspot_email_3</ExternalEventId__c></sObjects><sObjects><type>Task</type><WhoId>contact_id_1</WhoId><Subject>Hubspot-Event-4</Subject><Description>837382</Description><ActivityDate>2019-07-18T20:19:33.000Z</ActivityDate><Type>Email</Type><ExternalEventId__c>hubspot_email_4</ExternalEventId__c></sObjects></create>"
                  ) !== -1
                );
              })
              .reply(200, respBodyC1, {
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
                id: "user_id_1",
                email: "user_1@hull.com",
                "salesforce_contact/id": "contact_id_1",
                anonymous_ids: ["salesforce-contact:contact_id_1"]
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
                  event: "Hubspot-Event-1",
                  event_id: "hubspot_email_1",
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
                  event_id: "random_event_1",
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
                  event: "Hubspot-Event-2",
                  event_id: "hubspot_email_2",
                  user_id: "user_id_1",
                  created_at: "2019-07-18T20:19:33Z",
                  properties: {
                    emailCampaignId: "837382"
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
            },
            {
              message_id: 2,
              user: {
                id: "user_id_2",
                email: "user_2@hull.com",
                "salesforce_contact/id": "contact_id_1",
                anonymous_ids: ["salesforce-contact:contact_id_1"]
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
                  user_id: "user_id_2",
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
                  user_id: "user_id_2",
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
                  user_id: "user_id_2",
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
            },
            {
              message_id: 3,
              user: {
                id: "user_id_3",
                email: "user_3@hull.com",
                "salesforce_contact/id": "contact_id_1",
                anonymous_ids: ["salesforce-contact:contact_id_1"]
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
                  event: "Hubspot-Event-5",
                  event_id: "hubspot_email_5",
                  user_id: "user_id_3",
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
                  event_id: "random_event_3",
                  user_id: "user_id_3",
                  created_at: "2019-07-18T20:19:33Z",
                  properties: {
                    emailCampaignId: "837382",
                    created: "1563746708853"
                  },
                  event_source: "random_source",
                  context: {}
                },
                {
                  event: "Hubspot-Event-6",
                  event_id: "hubspot_email_6",
                  user_id: "user_id_3",
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
                url_length: 317,
                url: expect.stringMatching(/.*FROM.*Contact.*/)
              }
            ]),
            [
              "info",
              "outgoing.user.skip",
              {
                subject_type: "user",
                request_id: expect.whatever(),
                user_id: "user_id_1",
                user_email: "user_1@hull.com"
              },
              {
                reason:
                  "The contact in Salesforce is already in sync with Hull."
              }
            ],
            [
              "info",
              "outgoing.user.skip",
              {
                subject_type: "user",
                request_id: expect.whatever(),
                user_id: "user_id_2",
                user_email: "user_2@hull.com"
              },
              {
                reason:
                  "The contact in Salesforce is already in sync with Hull."
              }
            ],
            [
              "info",
              "outgoing.user.skip",
              {
                subject_type: "user",
                request_id: expect.whatever(),
                user_id: "user_id_3",
                user_email: "user_3@hull.com"
              },
              {
                reason:
                  "The contact in Salesforce is already in sync with Hull."
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
                request_id: expect.whatever(),
                subject_type: "user",
                user_email: "user_2@hull.com",
                user_id: "user_id_2"
              },
              {
                records: [
                  {
                    method: "insert",
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
                  },
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
          firehoseEvents: [],
          metrics: [
            ["increment", "connector.request", 1],
            ["increment", "ship.service_api.call", 1],
            ["increment", "ship.service_api.call", 1],
            ["value", "ship.service_api.limit", 50000],
            ["value", "ship.service_api.remaining", 49500],
            ["value", "ship.service_api.limit", 50000],
            ["value", "ship.service_api.remaining", 49500],
            ["increment", "ship.service_api.call", 1],
            ["value", "ship.service_api.limit", 50000],
            ["value", "ship.service_api.remaining", 49500],
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
