// @flow

const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";
const companyPropertyGroups = [
  ...require("../fixtures/get-properties-companies-groups"),
  {
    "name": "hull",
    "displayName": "Hull Properties",
    "displayOrder": 1,
    "hubspotDefined": false,
    "properties": [
      {
        "name": "hull_segments",
        "label": "Hull Segments",
        "groupName": "hull",
        "type": "enumeration",
        "fieldType": "checkbox",
        "options": [],
        "readOnlyValue": false
      }
    ]
  }];

process.env.OVERRIDE_HUBSPOT_URL = "";
process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";

const connector = {
  private_settings: {
    token: "hubToken",
    synchronized_account_segments: ["account_segment_1"],
    outgoing_account_attributes: [
      { "hull": "name", "service": "name", "overwrite": true },
      { "hull": "'hubspot/web_technologies'[]", "service": 'web_technologies', "overwrite": true },
      { "hull": "'hubspot/hs_additional_domains'", "service": "hs_additional_domains", "overwrite": true },
      { "hull": "account_segments.name[]", "service": "hull_segments", "overwrite": true }
    ],
    mark_deleted_contacts: false,
    mark_deleted_companies: false
  }
};
const accountsSegments = [
  {
    name: "Account Segment 1",
    id: "account_segment_1"
  },
  {
    name: "Account Segment 2",
    id: "account_segment_2"
  }
];

it("should send out a new hull account to hubspot account update", () => {
  const domain = "hull.io";
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "account:update",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/contacts/v2/groups?includeProperties=true")
          .reply(200, []);
        scope.get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, companyPropertyGroups);
          scope.post("/companies/v1/batch-async/update?auditId=Hull", [{
            "properties": [
              { "name": "name", "value": "New Name" },
              { "name": "web_technologies","value":"technology 1"},
              { "name": "hs_additional_domains","value":"domain 1;domain 2;domain 3"},
              { "name": "hull_segments", "value": "Account Segment 1;Account Segment 2" },
              { "name": "domain", "value": "hull.io" }
            ],
            objectId: "companyHubspotId123"
          }]).reply(202);
        return scope;
      },
      connector,
      usersSegments: [],
      accountsSegments,
      messages: [
        {
          changes: {
            is_new: false,
            user: {},
            account: { name: ["old", "New Name"] },
            segments: {},
            account_segments: {}
          },
          account: {
            domain,
            name: "New Name",
            "hubspot/id": "companyHubspotId123",
            "hubspot/web_technologies": "technology 1",
            "hubspot/hs_additional_domains": ["domain 1", "domain 2", "domain 3"]
          },
          account_segments: [
            { name: "Account Segment 1", id: "account_segment_1" },
            { name: "Account Segment 2", id: "account_segment_2" }
          ]
        }
      ],
      response: {
        flow_control: {
          type: "next"
        }
      },
      logs: [
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["debug", "outgoing.job.start", expect.whatever(), { "toInsert": 0, "toSkip": 0, "toUpdate": 1 }],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "POST", "status": 202, "url": "/companies/v1/batch-async/update" })],
        [
          "info",
          "outgoing.account.success",
          expect.objectContaining({ "subject_type": "account", "account_domain": domain }),
          {
            hubspotWriteCompany: {
              "properties": [
                { "name": "name", "value": "New Name" },
                { "name":"web_technologies","value":"technology 1"},
                { "name":"hs_additional_domains","value":"domain 1;domain 2;domain 3"},
                { "name": "hull_segments", "value": "Account Segment 1;Account Segment 2" },
                { "name": "domain", "value": "hull.io" }
              ],
              objectId: "companyHubspotId123"
            },
            operation: "update"
          }
        ]
      ],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)]
      ],
      platformApiCalls: []
    };
  });
});
