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
      { hull: "traits_outreach/title", service: "jobtitle" }
    ],
    link_users_in_service: true,
    mark_deleted_contacts: false,
    mark_deleted_companies: false
  }
};
const usersSegments = [
  {
    name: "testSegment",
    id: "hullSegmentId"
  }
];

it("should filter because none of the mapped attributes have changed", () => {
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
        scope
          .post("/companies/v2/domains/doe.com/companies", {
            requestOptions: {
              properties: ["domain", "hs_lastmodifieddate", "name"]
            }
          })
          .reply(200, { "results": [] });

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
            "traits_hubspot/id": 1234
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
            "account": {},
            "segments": {},
            "account_segments": {}
          },
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
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["debug", "outgoing.job.start", expect.whatever(), {"toInsert": 1, "toSkip": 0, "toUpdate": 0}],
        [
          "debug",
          "outgoing.user.skip",
          expect.objectContaining({ "subject_type": "user", "user_email": "email@email.com"}),
          {
            "reason": "No changes on any of the synchronized attributes for this user.  If you think this is a mistake, please check the settings page for the synchronized user attributes to ensure that the attribute which changed is in the synchronized outgoing attributes"
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
