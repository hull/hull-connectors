// @flow
/* global describe, it, beforeEach, afterEach */
const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";

import connectorConfig from "../../../server/config";
import manifest from "../../../manifest.json";

process.env.OVERRIDE_HUBSPOT_URL = "";

const connector = {
  private_settings: {
    token: "hubToken",
    token_fetched_at: 1419967066626,
    expires_in: 10,
    refresh_token: "123",
    mark_deleted_contacts: false,
    mark_deleted_companies: false,
    outgoing_user_attributes: [
      { "hull": "updated_at", "service": "custom_updated_at", "overwrite": true },
      { "hull": "custom_attribute", "service": "custom_attribute_text_field", "overwrite": true },
      { "hull": "some_date", "service": "first_deal_created_date", "overwrite": true }
    ]
  }
};

it("Should sync outgoing user and account attributes to Hubspot", () => {
  return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "ship:update",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/contacts/v2/groups?includeProperties=true")
          .reply(200, [
            {
              "name": "contactinformation",
              "displayName": "Contact Information",
              "displayOrder": 0,
              "hubspotDefined": true,
              "properties": [
                {
                  "name": "first_deal_created_date",
                  "label": "first_deal_created_date",
                  "groupName": "contactinformation",
                  "type": "datetime",
                  "fieldType": "date"
                }
              ]
            }
          ]);

        scope.get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, []);

        scope.post("/contacts/v2/groups", {
          "name":"hull",
          "displayName":"Hull Properties",
          "displayOrder":1
        }).reply(200, []);

        scope.post("/contacts/v2/properties", {
          "name": "custom_updated_at",
          "label": "custom_updated_at",
          "type": "datetime",
          "fieldType": "text",
          "options": [],
          "formField": false,
          "calculated": false,
          "groupName": "hull"
        }).reply(200, []);

        scope.post("/contacts/v2/properties", {
          "type": "string",
          "fieldType": "text",
          "name": "custom_attribute_text_field",
          "label": "custom_attribute_text_field",
          "options": [],
          "formField": false,
          "calculated": false,
          "groupName": "hull"
        }).reply(200, []);

        scope.post("/properties/v1/companies/groups", {
          "name":"hull",
          "displayName":"Hull Properties",
          "displayOrder":1
        }).reply(200, []);

        return scope;
      },
      connector,
      usersSegments: [],
      accountsSegments: [],
      response: { "flow_control": { "type": "next", } },
      logs: [
        [
          "debug",
          "connector.service_api.call",
          {
            "request_id": expect.whatever()
          },
          {
            "responseTime": expect.whatever(),
            "method": "GET",
            "url": "/contacts/v2/groups",
            "status": 200,
            "vars": {}
          }
        ],
        [
          "debug",
          "connector.service_api.call",
          {
            "request_id": expect.whatever()
          },
          {
            "responseTime": expect.whatever(),
            "method": "GET",
            "url": "/properties/v1/companies/groups",
            "status": 200,
            "vars": {}
          }
        ],
        [
          "debug",
          "connector.service_api.call",
          {
            "request_id": expect.whatever()
          },
          {
            "responseTime": expect.whatever(),
            "method": "POST",
            "url": "/contacts/v2/groups",
            "status": 200,
            "vars": {}
          }
        ],
        [
          "debug",
          "connector.service_api.call",
          {
            "request_id": expect.whatever()
          },
          {
            "responseTime": expect.whatever(),
            "method": "POST",
            "url": "/contacts/v2/properties",
            "status": 200,
            "vars": {}
          }
        ],
        [
          "debug",
          "connector.service_api.call",
          {
            "request_id": expect.whatever()
          },
          {
            "responseTime": expect.whatever(),
            "method": "POST",
            "url": "/contacts/v2/properties",
            "status": 200,
            "vars": {}
          }
        ],
        [
          "debug",
          "ContactProperty.ensureCustomProperties",
          {
            "request_id": expect.whatever()
          },
          [
            undefined,
            undefined,
            "first_deal_created_date"
          ]
        ],
        [
          "debug",
          "connector.service_api.call",
          {
            "request_id": expect.whatever()
          },
          {
            "responseTime": expect.whatever(),
            "method": "POST",
            "url": "/properties/v1/companies/groups",
            "status": 200,
            "vars": {}
          }
        ],
        [
          "debug",
          "CompanyProperty.ensureCustomProperties",
          {
            "request_id": expect.whatever()
          },
          []
        ]
      ],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()]
      ],
      platformApiCalls: []
    };
  });
});
