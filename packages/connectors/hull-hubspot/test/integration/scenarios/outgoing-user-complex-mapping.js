// @flow
/* global describe, it, beforeEach, afterEach */
const testScenario = require("hull-connector-framework/src/test-scenario");
const connectorServer = require("../../../server/server");
const connectorManifest = require("../../../manifest");

process.env.OVERRIDE_HUBSPOT_URL = "";

/**
 * This tests if the overwrite field is true/false/notset
 * because this is a legacy feature that some customers may still have
 * by default we overwrite for any of these values
 */
const connector = {
  private_settings: {
    token: "hubToken",
    synchronized_user_segments: ["hullSegmentId"],
    outgoing_user_attributes: [
      { hull: "first_name", service: "firstname", overwrite: true },
      { hull: "last_name", service: "lastname", overwrite: false },
      { hull: "traits_group/custom_calculated_score", service: "custom_hubspot_score" },
      { hull: "traits_custom_numeric", service: "custom_hubspot_numeric", overwrite: true },
      { hull: "traits_custom_array", service: "custom_hubspot_array" },
      { hull: "traits_custom_empty_array", service: "custom_hubspot_empty_array", overwrite: true },
      { hull: "traits_custom_true", service: "custom_hubspot_true", overwrite: true },
      { hull: "traits_custom_false", service: "custom_hubspot_false", overwrite: true },
      { hull: "traits_custom_null", service: "custom_hubspot_null", overwrite: true },
      { hull: "traits_custom_empty_string", service: "custom_hubspot_empty_string", overwrite: true },
      { hull: "traits_custom_zero", service: "custom_hubspot_zero", overwrite: true },
      { hull: "traits_custom_undefined", service: "custom_hubspot_undefined", overwrite: true },
      { hull: "traits_custom_date_at", service: "custom_hubspot_date_at", overwrite: true },

      { hull: "account.id", service: "custom_hubspot_account_id", overwrite: true },
      { hull: "account.domain", service: "custom_hubspot_account_domain", overwrite: true },
      { hull: "account.group/created_at", service: "custom_hubspot_account_group_created_at", overwrite: true },

      { hull: "account.custom_numeric", service: "custom_hubspot_account_numeric", overwrite: true },
      { hull: "account.custom_array", service: "custom_hubspot_account_array", overwrite: true },
      { hull: "account.custom_empty_array", service: "custom_hubspot_account_empty_array", overwrite: true },
      { hull: "account.custom_true", service: "custom_hubspot_account_true", overwrite: true },
      { hull: "account.custom_false", service: "custom_hubspot_account_false", overwrite: true },
      { hull: "account.custom_null", service: "custom_hubspot_account_null", overwrite: true },
      { hull: "account.custom_empty_string", service: "custom_hubspot_account_empty_string", overwrite: true },
      { hull: "account.custom_zero", service: "custom_hubspot_account_zero", overwrite: true },
      { hull: "account.custom_undefined", service: "custom_hubspot_account_undefined", overwrite: true },
      { hull: "account.custom_date_at", service: "custom_hubspot_account_date_at", overwrite: true }
    ]
  }
};
const usersSegments = [
  {
    name: "testSegment",
    id: "hullSegmentId"
  }
];

it("should send out a new hull user to hubspot with complex fields mapping", () => {
  const email = "email@email.com";
  return testScenario({ connectorServer, connectorManifest }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/contacts/v2/groups?includeProperties=true")
          .reply(200, require("../fixtures/get-contacts-groups"));
        scope.get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, require("../fixtures/get-properties-companies-groups"));
        scope.post("/contacts/v1/contact/batch/?auditId=Hull", [{
          "properties": [{
              "property": "firstname",
              "value": "John"
            }, {
              "property": "lastname",
              "value": "NewLastName"
            }, {
              "property": "hull_custom_hubspot_score",
              "value": 456
            }, {
              "property": "hull_custom_hubspot_numeric",
              "value": 123
            }, {
              "property": "hull_custom_hubspot_array",
              "value": "A;B"
            }, {
              "property": "hull_custom_hubspot_true",
              "value": true
            }, {
              "property": "hull_custom_hubspot_false",
              "value": false
            }, {
              "property": "hull_custom_hubspot_date_at",
              "value": 1540374459000
            }, {
              "property": "hull_custom_hubspot_account_id",
              "value": "acc123"
            }, {
              "property": "hull_custom_hubspot_account_domain",
              "value": "doe.com"
            }, {
              "property": "hull_custom_hubspot_account_group_created_at",
              "value": 1477302459000
            }, {
              "property": "hull_custom_hubspot_account_numeric",
              "value": 123
            }, {
              "property": "hull_custom_hubspot_account_array",
              "value": "A;B"
            }, {
              "property": "hull_custom_hubspot_account_true",
              "value": true
            }, {
              "property": "hull_custom_hubspot_account_false",
              "value": false
            }, {
              "property": "hull_custom_hubspot_account_date_at",
              "value": 1540374459000
            }, {
              "property": "hull_segments",
              "value": "testSegment"
            }],
          "email": "email@email.com"
          }]
        ).reply(202);
        return scope;
      },
      connector,
      usersSegments,
      accountsSegments: [],
      messages: [
        {
          user: {
            email,
            first_name: "John",
            last_name: "NewLastName",
            "traits_hubspot/last_name": "CurrentLastName",
            "traits_group/custom_calculated_score": 456,
            traits_custom_numeric: 123,
            traits_custom_array: ["A", "B"],
            traits_custom_empty_array: [],
            traits_custom_true: true,
            traits_custom_false: false,
            traits_custom_null: null,
            traits_custom_empty_string: "",
            traits_custom_zero: 0,
            // traits_custom_undefined: "", -> this is not present
            traits_custom_date_at: "2018-10-24T09:47:39Z"
          },
          account: {
            id: "acc123",
            domain: "doe.com",
            "group/created_at": "2016-10-24T09:47:39Z",
            custom_numeric: 123,
            custom_array: ["A", "B"],
            custom_empty_array: [],
            custom_true: true,
            custom_false: false,
            custom_null: null,
            custom_empty_string: "",
            custom_zero: 0,
            // custom_undefined: "", -> this is not present
            custom_date_at: "2018-10-24T09:47:39Z",
          },
          segments: [{ id: "hullSegmentId", name: "hullSegmentName" }]
        }
      ],
      response: {
        flow_control: {
          in: 5,
          in_time: 10,
          size: 10,
          type: "next"
        }
      },
      logs: [
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        [
          "debug",
          "OVERWRITTING",
          expect.whatever(),
          {
            value: "NewLastName",
            valueFromDefaultMapping: "CurrentLastName",
          }
        ],
        ["debug", "outgoing.job.start", expect.whatever(), {"toInsert": 1, "toSkip": 0, "toUpdate": 0}],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "POST", "status": 202, "url": "/contacts/v1/contact/batch/" })],
        [
          "info",
          "outgoing.user.success",
          expect.objectContaining({ "subject_type": "user", "user_email": "email@email.com"}),
          {
            "email": "email@email.com",
            "properties": [{
                "property": "firstname",
                "value": "John"
              }, {
                "property": "lastname",
                "value": "NewLastName"
              }, {
                "property": "hull_custom_hubspot_score",
                "value": 456
              }, {
                "property": "hull_custom_hubspot_numeric",
                "value": 123
              }, {
                "property": "hull_custom_hubspot_array",
                "value": "A;B"
              }, {
                "property": "hull_custom_hubspot_true",
                "value": true
              }, {
                "property": "hull_custom_hubspot_false",
                "value": false
              }, {
                "property": "hull_custom_hubspot_date_at",
                "value": 1540374459000
              }, {
                "property": "hull_custom_hubspot_account_id",
                "value": "acc123"
              }, {
                "property": "hull_custom_hubspot_account_domain",
                "value": "doe.com"
              }, {
                "property": "hull_custom_hubspot_account_group_created_at",
                "value": 1477302459000
              }, {
                "property": "hull_custom_hubspot_account_numeric",
                "value": 123
              }, {
                "property": "hull_custom_hubspot_account_array",
                "value": "A;B"
              }, {
                "property": "hull_custom_hubspot_account_true",
                "value": true
              }, {
                "property": "hull_custom_hubspot_account_false",
                "value": false
              }, {
                "property": "hull_custom_hubspot_account_date_at",
                "value": 1540374459000
              }, {
                "property": "hull_segments",
                "value": "testSegment"
              }]
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
      platformApiCalls: [
        ["GET", "/api/v1/search/user_reports/bootstrap", {}, {}],
        ["GET", "/api/v1/search/account_reports/bootstrap", {}, {}]
      ]
    };
  });
});
