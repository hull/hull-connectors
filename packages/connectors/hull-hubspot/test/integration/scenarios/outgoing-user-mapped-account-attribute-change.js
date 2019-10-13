// @flow
const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";


process.env.OVERRIDE_HUBSPOT_URL = "";
process.env.CLIENT_ID = "ASDF";
process.env.CLIENT_SECRET = "134";

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
      { hull: "traits_outreach/title", service: "jobtitle" },
      { hull: "account.id", service: "custom_hubspot_account_id", overwrite: true },
      { hull: "account.domain", service: "custom_hubspot_account_domain", overwrite: true }
    ],
    link_users_in_service: true
  }
};
const usersSegments = [
  {
    name: "testSegment",
    id: "hullSegmentId"
  }
];

it("should allow through with mapped account attribute changes", () => {
  const email = "email@email.com";
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
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
        scope.post("/contacts/v1/contact/batch/?auditId=Hull",
          [{"properties":[{"property":"hull_custom_hubspot_account_id","value":"acc123"},{"property":"hull_custom_hubspot_account_domain","value":"doe.com"},{"property":"hull_segments","value":"testSegment"}],"email":"email@email.com"}]
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
            "traits_outreach/title": "sometitle",
            traits_custom_numeric: 123,
            traits_custom_array: ["A", "B"],
            traits_custom_empty_array: [],
            traits_custom_true: true,
            traits_custom_false: false,
            traits_custom_null: null,
            traits_custom_empty_string: "",
            traits_custom_zero: 0,
            // traits_custom_undefined: "", -> this is not present
            traits_custom_date_at: "2018-10-24T09:47:39Z",
            "traits_hubspot/id": 5677
          },
          account: {
            id: "acc123",
            domain: "doe.com",
            "group/created_at": "2016-10-24T09:47:39Z",
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
          segments: [{ id: "hullSegmentId", name: "hullSegmentName" }],
          changes: {
            "is_new": false,
            "user": {
              "traits_unified_data/somefield": [
                null,
                "asdf"
              ]
            },
            "account": {
              "domain": [
                "otherdomain.com",
                "doe.com"
              ]
            },
            "segments": {},
            "account_segments": {}
          },
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
        ["debug", "outgoing.job.start", expect.whatever(), {"toInsert": 1, "toSkip": 0, "toUpdate": 0}],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "POST", "status": 202, "url": "/contacts/v1/contact/batch/" })],
        [
          "info",
          "outgoing.user.success",
          expect.objectContaining({ "subject_type": "user", "user_email": "email@email.com"}),
          {
            "email": "email@email.com",
            "properties": [{
              "property": "hull_custom_hubspot_account_id",
              "value": "acc123"
            }, {
              "property": "hull_custom_hubspot_account_domain",
              "value": "doe.com"
            }, {
              "property": "hull_segments",
              "value": "testSegment",
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
