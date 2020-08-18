// @flow

const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";

const companyPropertyGroups = require("../fixtures/get-properties-companies-groups");
const contactPropertyGroups = require("../fixtures/get-contacts-groups");

process.env.OVERRIDE_HUBSPOT_URL = "";
process.env.CLIENT_ID = "1";
process.env.CLIENT_SECRET = "1";

const connector = {
  private_settings: {
    token: "hubToken",
    mark_deleted_contacts: false,
    mark_deleted_companies: false
  }
};

it("should not create fields on 3rd party if no segments are in the org", () => {
  const domain = "hull.io";
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "ship:update",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/contacts/v2/groups?includeProperties=true")
          .reply(200, contactPropertyGroups);
        scope.get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, companyPropertyGroups);
        scope.post("/contacts/v2/groups", {
          name: "hull",
          displayName: "Hull Properties",
          displayOrder: 1
        }).reply(200, {
          "portalId": 2511111,
          "name": "hull",
          "displayName": "Hull Properties",
          "displayOrder": 1
        });
        scope.post("/properties/v1/companies/groups", {
          name: "hull",
          displayName: "Hull Properties",
          displayOrder: 1
        }).reply(200, {
          "portalId": 2511111,
          "name": "hull",
          "displayName": "Hull Properties",
          "displayOrder": 1
        });
        // 400
        // {
        //   "status": "error",
        //   "message": "Property 'hull_segments_test' has no options but options are required!"
        // }

        return scope;
      },
      connector,
      usersSegments: [],
      accountsSegments: [],
      messages: [
        {
          account: {
            domain
          },
          account_segments: [{ id: "hullSegmentId", name: "hullSegmentName" }]
        }
      ],
      response: {
        flow_control: {
          type: "next"
        }
      },
      logs: [
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "GET", "status": 200, "url": "/contacts/v2/groups" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "GET", "status": 200, "url": "/properties/v1/companies/groups" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "POST", "status": 200, "url": "/contacts/v2/groups" })],
        expect.arrayContaining(["ContactProperty.ensureCustomProperties"]),
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "POST", "status": 200, "url": "/properties/v1/companies/groups" })],
        expect.arrayContaining(["CompanyProperty.ensureCustomProperties"])
      ],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
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
