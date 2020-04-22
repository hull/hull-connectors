// @flow

const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";


process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";

const connector = {
  private_settings: {
    token: "hubToken",
    refresh_token: "refreshToken",
    token_fetched_at: "1541670608956",
    expires_in: 10000,
    synchronized_user_segments: ["hullSegmentId"],
    mark_deleted_contacts: false,
    mark_deleted_companies: false
  }
};
const usersSegments = [
  { name: "testSegment", id: "hullSegmentId" }
];

it("should refresh token and perform standard operation in case of token expired", () => {
  const email = "email@email.com";
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com", {
          reqheaders: {
            Authorization: (headerValue) => {
              return false;
            }
          }
        });
        scope.get("/contacts/v2/groups?includeProperties=true").reply(401, {});
        scope.post("/oauth/v1/token", "refresh_token=refreshToken&client_id=123&client_secret=abc&redirect_uri=&grant_type=refresh_token")
            .reply(200, {
              access_token: "newAccessToken",
              expires_in: 10000
            });

        scope.get("/contacts/v2/groups?includeProperties=true")
          .reply(200, []);
        scope.get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, []);
        scope.post("/contacts/v1/contact/batch/?auditId=Hull", [{
          "properties": [{
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
            email
          },
          segments: [{ id: "hullSegmentId", name: "testSegment" }],
          changes: {
            is_new: false,
            user: {},
            account: {},
            segments: {
              entered: [
                {
                  id: "hullSegmentId",
                  name: "hullSegmentName",
                  updated_at: "2018-12-06T14:23:38Z",
                  type: "users_segment",
                  created_at: "2018-11-29T10:46:39Z"
                }
              ]
            },
            account_segments: {}
          }
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
        ["debug", "retrying query", expect.whatever(), expect.whatever()],
        ["debug", "access_token", expect.whatever(), expect.whatever()],
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["debug", "outgoing.job.start", expect.whatever(), {"toInsert": 1, "toSkip": 0, "toUpdate": 0}],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "POST", "status": 202, "url": "/contacts/v1/contact/batch/" })],
        [
          "info",
          "outgoing.user.success",
          expect.objectContaining({ "subject_type": "user", "user_email": "email@email.com"}),
          { hubspotWriteContact: {"email": "email@email.com", "properties": [{"property": "hull_segments", "value": "testSegment"}]}}
        ]
      ],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "connector.service_api.error", 1],
        ["increment", "ship.service_api.call", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)]
      ],
      platformApiCalls: [
        ["GET", "/api/v1/app", {}, {}],
        [
          "PUT",
          "/api/v1/9993743b22d60dd829001999",
          {},
          {
            "private_settings":  {
              expires_in: 10000,
              refresh_token: "refreshToken",
              synchronized_user_segments: [
                "hullSegmentId",
              ],
              token: "newAccessToken",
              token_fetched_at: expect.any(String),
              mark_deleted_contacts: false,
              mark_deleted_companies: false
            },
            "refresh_status": false
          }
        ],
        ["GET", "/api/v1/search/user_reports/bootstrap", {}, {}],
        ["GET", "/api/v1/search/account_reports/bootstrap", {}, {}]
      ]
    };
  });
});
