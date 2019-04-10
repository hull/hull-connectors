// @flow
import connectorConfig from "../../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.MAILCHIMP_CLIENT_ID = "1234";
process.env.MAILCHIMP_CLIENT_SECRET = "1234";
process.env.COMBINED = "true";

const connector = {
  id: "123456789012345678901234",
  private_settings: {
    api_key: "1",
    domain: "mock",
    mailchimp_list_id: "1",
    interest_category_id: "2",
    interests_mapping: {
      hullSegmentId: "MailchimpInterestId"
    },
    segment_mapping: {
      hullSegmentId: "MailchimpSegmentId"
    },
    synchronized_user_segments: ["hullSegmentId"],
    outgoing_user_attributes: [
      { hull: "first_name", service: "TOP_LEVEL_TRAIT", overwrite: true },
      {
        hull: "traits_group/custom_calculated_score",
        service: "USER_CUSTOM_GROUP_TRAIT",
        overwrite: true
      },

      {
        hull: "traits_custom_numeric",
        service: "USER_CUSTOM_NUMERIC_VALUE",
        overwrite: true
      },
      {
        hull: "traits_custom_array",
        service: "USER_CUSTOM_ARRAY_VALUE",
        overwrite: true
      },
      {
        hull: "traits_custom_empty_array",
        service: "USER_CUSTOM_EMPTY_ARRAY_VALUE",
        overwrite: true
      },
      {
        hull: "traits_custom_true",
        service: "USER_CUSTOM_TRUE_VALUE",
        overwrite: true
      },
      {
        hull: "traits_custom_false",
        service: "USER_CUSTOM_FALSE_VALUE",
        overwrite: true
      },
      {
        hull: "traits_custom_null",
        service: "USER_CUSTOM_NULL_VALUE",
        overwrite: true
      },
      {
        hull: "custom_empty_string",
        service: "USER_CUSTOM_EMPTY_STRING_VALUE",
        overwrite: true
      },
      {
        hull: "traits_custom_zero",
        service: "USER_CUSTOM_ZERO_VALUE",
        overwrite: true
      },
      {
        hull: "traits_custom_undefined",
        service: "USER_CUSTOM_UNDEFINED_VALUE",
        overwrite: true
      },
      {
        hull: "traits_custom_date_at",
        service: "USER_CUSTOM_DATE_VALUE",
        overwrite: true
      },

      {
        hull: "account.domain",
        service: "ACCOUNT_TOP_LEVEL_TRAIT",
        overwrite: true
      },
      {
        hull: "account.group/created_at",
        service: "ACCOUNT_CUSTOM_GROUP_TRAIT",
        overwrite: true
      }
    ]
  }
};
const usersSegments = [
  {
    name: "testSegment",
    id: "hullSegmentId"
  }
];

it("should send matching user to the mailchimp", () => {
  const email = "email@email.com";
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("https://mock.api.mailchimp.com/3.0");
        scope.get("/lists/1/webhooks").reply(200, {
          webhooks: [
            { url: "localhost:8000/mailchimp?ship=123456789012345678901234" }
          ]
        });
        scope
          .post("/lists/1", {
            members: [
              {
                email_type: "html",
                merge_fields: {
                  TOP_LEVEL_TRAIT: "John",
                  USER_CUSTOM_GROUP_TRAIT: 123,

                  USER_CUSTOM_NUMERIC_VALUE: 123,
                  USER_CUSTOM_ARRAY_VALUE: ["A", "B"],
                  USER_CUSTOM_EMPTY_ARRAY_VALUE: [],
                  USER_CUSTOM_TRUE_VALUE: true,
                  USER_CUSTOM_FALSE_VALUE: "",
                  USER_CUSTOM_NULL_VALUE: "",
                  USER_CUSTOM_EMPTY_STRING_VALUE: "",
                  USER_CUSTOM_ZERO_VALUE: "",
                  USER_CUSTOM_UNDEFINED_VALUE: "",
                  USER_CUSTOM_DATE_VALUE: "2018-10-24T09:47:39Z",
                  ACCOUNT_TOP_LEVEL_TRAIT: "doe.com",
                  ACCOUNT_CUSTOM_GROUP_TRAIT: "2016-10-24T09:47:39Z"
                },
                interests: {
                  MailchimpInterestId: true
                },
                email_address: email,
                status_if_new: "subscribed"
              }
            ],
            update_existing: true
          })
          .reply(200);
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
            "traits_group/custom_calculated_score": 123,
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
            custom_date_at: "2018-10-24T09:47:39Z"
          },
          segments: [{ id: "hullSegmentId", name: "hullSegmentName" }]
        }
      ],
      response: {
        flow_control: {
          type: "next",
          in: 10,
          in_time: 30000,
          size: 50
        }
      },
      logs: [
        [
          "debug",
          "outgoing.user.start",
          expect.objectContaining({
            subject_type: "user",
            user_email: email
          }),
          { changes: {}, events: [], segments: ["hullSegmentName"] }
        ],
        ["debug", "outgoing.job.start", expect.whatever(), { messages: 1 }],
        [
          "debug",
          "connector.service_api.call",
          expect.whatever(),
          expect.objectContaining({
            method: "GET",
            url: "/lists/{{listId}}/webhooks"
          })
        ],
        [
          "debug",
          "connector.service_api.call",
          expect.whatever(),
          expect.objectContaining({
            method: "POST",
            url: "/lists/{{listId}}"
          })
        ],
        [
          "info",
          "outgoing.user.success",
          expect.objectContaining({
            subject_type: "user",
            user_email: email
          }),
          {
            member: {
              email_address: email,
              email_type: "html",
              interests: {
                MailchimpInterestId: true
              },
              merge_fields: {
                TOP_LEVEL_TRAIT: "John",
                USER_CUSTOM_GROUP_TRAIT: 123,

                USER_CUSTOM_NUMERIC_VALUE: 123,
                USER_CUSTOM_ARRAY_VALUE: ["A", "B"],
                USER_CUSTOM_EMPTY_ARRAY_VALUE: [],
                USER_CUSTOM_TRUE_VALUE: true,
                USER_CUSTOM_FALSE_VALUE: "",
                USER_CUSTOM_NULL_VALUE: "",
                USER_CUSTOM_EMPTY_STRING_VALUE: "",
                USER_CUSTOM_ZERO_VALUE: "",
                USER_CUSTOM_UNDEFINED_VALUE: "",
                USER_CUSTOM_DATE_VALUE: "2018-10-24T09:47:39Z",
                ACCOUNT_TOP_LEVEL_TRAIT: "doe.com",
                ACCOUNT_CUSTOM_GROUP_TRAIT: "2016-10-24T09:47:39Z"
              },
              status_if_new: "subscribed"
            }
          }
        ],
        [
          "debug",
          "outgoing.job.success",
          expect.whatever(),
          { errors: 0, successes: 1 }
        ]
      ],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        [
          "value",
          "connector.send_user_update_messages.time",
          expect.whatever()
        ],
        ["value", "connector.send_user_update_messages.messages", 1],
        ["increment", "ship.outgoing.users", 1]
      ]
    };
  });
});
