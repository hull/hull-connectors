// @flow
import connectorConfig from "../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");
const FacebookMock = require("./support/facebook-mock");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";

const private_settings = {
  field_email: "email",
  field_first_name: "firstName",
  field_last_name: "lastName",
  synchronized_segments: ["hullsegment0hullsegment1", "testsegment0testsegment1"],
  facebook_ad_account_id: "123",
  field_phone: "phone",
  facebook_access_token: "321"
};

const connector = {
  id: "123456789012345678901234",
  private_settings
};
const usersSegments = [
  {
    name: "hullSegmentId",
    id: "hullsegment0hullsegment1"
  },
  {
    name: "testSegment",
    id: "testsegment0testsegment1"
  }
];

it("should send all user fields correctly", () => {
  const email = "";
  return testScenario(
    {
      connectorConfig: () => ({
        ...connectorConfig(),
        queueConfig: undefined
      })
    },
    ({ handlers, nock, expect }) => {
      const facebookMock = new FacebookMock(nock);
      return {
        handlerType: handlers.batchHandler,
        handlerUrl: "batch?audience=testsegment0testsegment1",
        channel: "user:update",
        externalApiMock: () => {
          return facebookMock.setUpCreateUserInAudienceNock("testsegment0testsegment1", body =>
            decodeURIComponent(body) === "payload[schema][0]=EMAIL&payload[schema][1]=FN&payload[schema][2]=LN&payload[schema][3]=PHONE" +
            "&payload[data][0][0]=ba146360c43d5beae30f5aaac50232b9ad38ec8c0823564f21cfebc89a3ce675" +
            "&payload[data][0][1]=119c9ae6f9ca741bd0a76f87fba0b22cab5413187afb2906aa2875c38e213603" +
            "&payload[data][0][2]=f21dea74d898cfeaf836ecc99ad0331bade09711ff927365e91ada2ff4cb5caf" +
            "&payload[data][0][3]=" +
            "&payload[data][1][0]=a8e34c39d390c30c3ff245256c46c7076cecb7dfcfd60f7534d1037e901fad76" +
            "&payload[data][1][1]=34550715062af006ac4fab288de67ecb44793c3a05c475227241535f6ef7a81b" +
            "&payload[data][1][2]=776eaa68e0215ccdf061119ea766fb3ad3f63ee8033de2536d6e5ea7b7674a23" +
            "&payload[data][1][3]=15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225" +
            "&access_token=321");
        },
        connector,
        usersSegments,
        accountsSegments: [],
        messages: [
          {
            email: "test1@email.com",
            id: "11111",
            firstName: "James",
            lastName: "Bond"
          },
          {
            email: "test2@email.com",
            id: "22222",
            firstName: "Michael",
            lastName: "Kors",
            phone: "123456789"
          }
        ],
        response: {},
        logs: [
          [
            "debug",
            "addUsersToAudience",
            {},
            {
              audienceId: "testsegment0testsegment1",
              users: [
                "test1@email.com",
                "test2@email.com"
              ]
            }
          ],
          [
            "debug",
            "updateAudienceUsers",
            {},
            expect.objectContaining({
              audienceId: "testsegment0testsegment1",
            })
          ],
          [
            "info",
            "outgoing.user.success",
            {
              subject_type: "user",
              user_email: "test1@email.com",
              user_id: "11111"
            },
            {
              audienceId: "testsegment0testsegment1",
              method: "post"
            }
          ],
          [
            "info",
            "outgoing.user.success",
            {
              subject_type: "user",
              user_email: "test2@email.com",
              user_id: "22222"
            },
            {
              audienceId: "testsegment0testsegment1",
              method: "post"
            }
          ]
        ],
        metrics: [
          [
            "increment",
            "connector.request",
            1
          ],
          [
            "increment",
            "ship.outgoing.users",
            2
          ],
          [
            "increment",
            "ship.outgoing.users.add",
            2
          ],
          [
            "increment",
            "ship.service_api.call",
            1
          ]
        ],
        platformApiCalls: [
          [
            "GET",
            "/_users_batch",
            {},
            {}
          ]
        ],
        firehoseEvents: []
      };
    }
  );
});
