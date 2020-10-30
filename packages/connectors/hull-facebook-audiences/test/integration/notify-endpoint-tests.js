// @flow
import connectorConfig from "../../server/config";

const path = require("path");
const testScenario = require("hull-connector-framework/src/test-scenario");
const FacebookMock = require("./support/facebook-mock");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";

const private_settings = {
  field_email: "email",
  field_first_name: "firstName",
  field_last_name: "lastName",
  synchronized_segments: ["hullsegment0hullsegment1", "testsegment0testsegment1"],
  synchronized_segments_mapping: [
    { segment_id: "hullsegment0hullsegment1", customer_file_source: "USER_PROVIDED_ONLY" },
    { segment_id: "testsegment0testsegment1", customer_file_source: "BOTH_USER_AND_PARTNER_PROVIDED" }
  ],
  facebook_ad_account_id: "123",
  facebook_access_token: "321"
};

const connector = { id: "123456789012345678901234", private_settings };
const usersSegments = [{
  name: "hullSegmentId",
  id: "hullsegment0hullsegment1"
}, {
  name: "testSegment",
  id: "testsegment0testsegment1"
}];

it("should send all user fields correctly", () => {
  return testScenario(
    {
      connectorConfig: () => ({
        ...connectorConfig(),
        queueConfig: undefined
      })
    },
    ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const facebookMock = new FacebookMock(nock);
          facebookMock.setUpGetAudiencesNock();
          facebookMock.setUpGetAudiencesNock();

          facebookMock.setUpCreateAudiencesNock("hullsegment0hullsegment1");
          facebookMock.setUpCreateAudiencesNock("testsegment0testsegment1");

          facebookMock.setUpGetAudiencesNock(true);

          facebookMock.setUpCreateUserInAudienceNock("testsegment0testsegment1");
          facebookMock.setUpDeleteUserInAudienceNock("hullsegment0hullsegment1");
          return facebookMock.getNock();
        },
        connector,
        usersSegments,
        accountsSegments: [],
        messages: [{
          user: { email: "foo@bar.com", id: "34567", firstName: "James", lastName: "Bond" },
          changes: {
            segments: {
              "left": [{
                "id": "hullsegment0hullsegment1",
                "name": "Approved users",
                "type": "users_segment",
                "query": {},
                "created_at": "2016-12-21T11:38:26Z",
                "updated_at": "2016-12-21T11:38:26Z"
              }],
              "entered": [{
                "id": "testsegment0testsegment1",
                "name": "Test users",
                "type": "users_segment",
                "query": {},
                "created_at": "2016-12-21T11:38:26Z",
                "updated_at": "2016-12-21T11:38:26Z"
              }]
            },
          },
          events: [],
          segments: [{ id: "testsegment0testsegment1", name: "Test users" }]
        }],
        response: {
          flow_control: {
            type: "next"
          }
        },
        logs: [
          [
            "debug",
            "connector.requestExtract.params",
            {
              "request_id": expect.whatever()
            },
            {
              "query": {},
              "format": "json",
              "url": expect.whatever(),
              "fields": [
                "email",
                "firstName",
                "lastName",
                "phone",
                "address_city",
                "address_country"
              ]
            }
          ],
          [
            "debug",
            "connector.requestExtract.params",
            {
              "request_id": expect.whatever()
            },
            {
              "query": {},
              "format": "json",
              "url": expect.whatever(),
              "fields": [
                "email",
                "firstName",
                "lastName",
                "phone",
                "address_city",
                "address_country"
              ]
            }
          ],
          [
            "debug",
            "addUsersToAudience",
            {
              "request_id": expect.whatever()
            },
            {
              "audienceId": "testsegment0testsegment1",
              "users": [
                "foo@bar.com"
              ]
            }
          ],
          [
            "debug",
            "updateAudienceUsers",
            {
              "request_id": expect.whatever()
            },
            {
              "audienceId": "testsegment0testsegment1",
              "payload": {
                "schema": [
                  "EMAIL",
                  "FN",
                  "LN"
                ],
                "data": expect.whatever()
              },
              "method": "post"
            }
          ],
          [
            "debug",
            "removeUsersFromAudience",
            {
              "request_id": expect.whatever()
            },
            {
              "audienceId": "hullsegment0hullsegment1",
              "users": [
                "foo@bar.com"
              ]
            }
          ],
          [
            "debug",
            "updateAudienceUsers",
            {
              "request_id": expect.whatever()
            },
            {
              "audienceId": "hullsegment0hullsegment1",
              "payload": {
                "schema": [
                  "EMAIL",
                  "FN",
                  "LN"
                ],
                "data": expect.whatever()
              },
              "method": "del"
            }
          ],
          [
            "info",
            "outgoing.user.success",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "34567",
              "user_email": "foo@bar.com"
            },
            {
              "audienceId": "testsegment0testsegment1",
              "method": "post"
            }
          ],
          [
            "info",
            "outgoing.user.success",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "34567",
              "user_email": "foo@bar.com"
            },
            {
              "audienceId": "hullsegment0hullsegment1",
              "method": "del"
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
            "ship.service_api.call",
            1
          ],
          [
            "increment",
            "ship.service_api.call",
            1
          ],
          [
            "increment",
            "ship.audience.create",
            1
          ],
          [
            "increment",
            "ship.service_api.call",
            1
          ],
          [
            "increment",
            "ship.audience.create",
            1
          ],
          [
            "increment",
            "ship.service_api.call",
            1
          ],
          [
            "increment",
            "ship.service_api.call",
            1
          ],
          [
            "increment",
            "ship.outgoing.users",
            1
          ],
          [
            "increment",
            "ship.outgoing.users.add",
            1
          ],
          [
            "increment",
            "ship.service_api.call",
            1
          ],
          [
            "increment",
            "ship.outgoing.users",
            1
          ],
          [
            "increment",
            "ship.outgoing.users.remove",
            1
          ],
          [
            "increment",
            "ship.service_api.call",
            1
          ]
        ],
        platformApiCalls: [
          [
            "POST",
            "/api/v1/extract/user_reports",
            {},
            {
              "query": {},
              "format": "json",
              "url": expect.whatever(),
              "fields": [
                "email",
                "firstName",
                "lastName",
                "phone",
                "address_city",
                "address_country"
              ]
            }
          ],
          [
            "POST",
            "/api/v1/extract/user_reports",
            {},
            {
              "query": {},
              "format": "json",
              "url": expect.whatever(),
              "fields": [
                "email",
                "firstName",
                "lastName",
                "phone",
                "address_city",
                "address_country"
              ]
            }
          ]
        ],
        firehoseEvents: []
      };
    }
  );
});
