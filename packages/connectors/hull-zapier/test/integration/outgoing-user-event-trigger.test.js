/* @flow */
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";
const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../server/config";

describe("Outgoing User Event Tests", () => {

  it("Send Single User Event To Zapier", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      const updateMessages = _.cloneDeep(require("./fixtures/notifier-payloads/update-single-user"));
      const private_settings = {
        ...updateMessages.connector.private_settings,
        triggers: [
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/user-event-created/1"
            },
            inputData: {
              "account_segments": [ 'all_segments' ],
              "user_segments": [ 'user_segment_1' ],
              "user_events": [ 'Email Opened' ]
            }
          }
        ]
      };
      const message1 =
        {
          "user": {
            "id": "5bd329d5e2bcf3eeaf000099",
            "email": "bob@bobby.com",
            "segment_ids": [
              "user_segment_1"
            ]
          },
          "changes": {
            "is_new": false,
            "user": {},
            "account": {},
            "account_segments": {},
            "segments": {}
          },
          "account": {},
          "segments": [
            {
              "id": "user_segment_1",
              "name": "UserSegment1"
            },
            {
              "id": "user_segment_2",
              "name": "UserSegment2"
            }
          ],
          "events": [
            {
              "event": "Email Opened",
              "event_id": "email_opened_1",
              "user_id": "user_id_1",
              "properties": {
                "emailCampaignId": "837382",
                "created": "1563746708853"
              },
              "event_source": "hubspot",
              "context": {}
            }
          ],
          "account_segments": [],
          "message_id": "message_1",
        };

      _.set(updateMessages, "messages", [
        message1
      ]);
      _.set(updateMessages.connector, "private_settings", private_settings);
      return _.assign(updateMessages, {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("https://hooks.zapier.com/hooks/standard/5687326");

          scope
            .post("/user-event-created/1")
            .reply(200, {
              "status": "success",
              "attempt": "1",
              "id": "1",
              "request_id": "1"
            });

          return scope;
        },
        response: { flow_control: { type: "next", in: 5, in_time: 10, size: 10, } },
        logs: [
          ["info", "outgoing.job.start", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "user" }],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            expect.objectContaining({"url": "https://hooks.zapier.com/hooks/standard/5687326/user-event-created/1", "method": "POST"})
          ],
          ["info", "outgoing.user.success",
            expect.objectContaining({ "subject_type": "user", "user_id": "5bd329d5e2bcf3eeaf000099", "user_email": "bob@bobby.com" }),
            expect.objectContaining({ "data": expect.objectContaining({"message_id": "message_1"}), "type": "User" })
          ],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "user" }]
        ],
        firehoseEvents:[],
        metrics: [["increment", "connector.request", 1,], ["increment", "ship.service_api.call", 1,], ["value", "connector.service_api.response_time", expect.whatever()]],
        platformApiCalls: []
      });
    });
  });

  it("User event not in whitelist. Should not send Single User Event To Zapier", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      const updateMessages = _.cloneDeep(require("./fixtures/notifier-payloads/update-single-user"));
      const private_settings = {
        ...updateMessages.connector.private_settings,
        triggers: [
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/user-event-created/1"
            },
            inputData: {
              "account_segments": [ 'all_segments' ],
              "user_segments": [ 'user_segment_1' ],
              "user_events": [ 'Email Sent' ]
            }
          }
        ]
      };
      const message1 =
        {
          "user": {
            "id": "5bd329d5e2bcf3eeaf000099",
            "email": "bob@bobby.com",
            "segment_ids": [
              "user_segment_1"
            ]
          },
          "changes": {
            "is_new": false,
            "user": {},
            "account": {},
            "account_segments": {},
            "segments": {}
          },
          "account": {},
          "segments": [
            {
              "id": "user_segment_1",
              "name": "UserSegment1"
            },
            {
              "id": "user_segment_2",
              "name": "UserSegment2"
            }
          ],
          "events": [
            {
              "event": "Email Opened",
              "event_id": "email_opened_1",
              "user_id": "user_id_1",
              "properties": {
                "emailCampaignId": "837382",
                "created": "1563746708853"
              },
              "event_source": "hubspot",
              "context": {}
            }
          ],
          "account_segments": [],
          "message_id": "message_1",
        };

      _.set(updateMessages, "messages", [
        message1
      ]);
      _.set(updateMessages.connector, "private_settings", private_settings);
      return _.assign(updateMessages, {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {},
        response: { flow_control: { type: "next", in: 5, in_time: 10, size: 10, } },
        logs: [
          ["info", "outgoing.job.start", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "user" }],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "user" }]
        ],
        firehoseEvents:[],
        metrics: [["increment", "connector.request", 1,]],
        platformApiCalls: []
      });
    });
  });

});
