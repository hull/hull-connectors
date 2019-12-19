/* @flow */
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";
const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../server/config";

describe("smoke test", () => {
  it("initial", () => {
    expect(1).toEqual(1);
  });
});

/*describe("Outgoing User Enters Segments Tests", () => {
  it("User enters segment. Should send to slack", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      const updateMessages = _.cloneDeep(require("./fixtures/notifier-payloads/update-entity"));
      const private_settings = {
        ...updateMessages.connector.private_settings,
        notify_events: [
          {
            "synchronized_segment": "segment_1",
            "text": "{{user.email}} did {{event.event}}",
            "event": "ENTERED_USER_SEGMENT",
            "channel": "channel_0"
          }
        ]
      };
      const message1 =
        {
          "changes": {
            "is_new": false,
            "user": {},
            "account": {},
            "account_segments": {},
            "segments": {
              "entered": [
                {
                  "id": "segment_1",
                  "name": "Segment1"
                }
              ]
            }
          },
          "account": {},
          "user": {
            "id": "1",
          },
          "segments": [],
          "account_segments": [],
          "message_id": "message_1"
        };

      _.set(updateMessages, "messages", [
        message1
      ]);
      _.set(updateMessages.connector, "private_settings", private_settings);
      return _.assign(updateMessages, {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notify",
        channel: "user:update",
        externalApiMock: () => {},
        response: { flow_control: { type: "next", in: 0.1, size: 100, } },
        logs: [
          ["info", "register.success", { "request_id": expect.whatever() }, undefined],
          ["info", "register.success", { "request_id": expect.whatever() }, undefined],
          ["info", "outgoing.user.success",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "1"
            },
            { "text": expect.whatever(), "channel": "channel_0" }
          ]
        ],
        firehoseEvents:[],
        metrics: [
          ["increment", "connector.request", 1],
          ["increment", "ship.outgoing.users", 1],
          ["increment", "ship.service_api.call", 1]
        ],
        platformApiCalls: []
      });
    });
  });

  it("User Enters 'ALL' Whitelisted Segment. Should send to slack", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      const updateMessages = _.cloneDeep(require("./fixtures/notifier-payloads/update-entity"));
      const private_settings = {
        ...updateMessages.connector.private_settings,
        notify_events: [
          {
            "synchronized_segment": "ALL",
            "text": "{{user.email}} did {{event.event}}",
            "event": "ENTERED_USER_SEGMENT",
            "channel": "channel_0"
          }
        ]
      };
      const message1 =
        {
          "changes": {
            "is_new": false,
            "user": {},
            "account": {},
            "account_segments": {},
            "segments": {
              "entered": [
                {
                  "id": "segment_1",
                  "name": "Segment1"
                }
              ]
            }
          },
          "account": {},
          "user": {
            "id": "1",
          },
          "segments": [],
          "account_segments": [],
          "message_id": "message_1"
        };

      _.set(updateMessages, "messages", [
        message1
      ]);
      _.set(updateMessages.connector, "private_settings", private_settings);
      return _.assign(updateMessages, {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notify",
        channel: "user:update",
        externalApiMock: () => {},
        response: { flow_control: { type: "next", in: 0.1, size: 100, } },
        logs: [
          ["info", "register.success", { "request_id": expect.whatever() }, undefined],
          ["info", "register.success", { "request_id": expect.whatever() }, undefined],
          ["info", "outgoing.user.success",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "1"
            },
            { "text": expect.whatever(), "channel": "channel_0" }
          ]
        ],
        firehoseEvents:[],
        metrics: [
          ["increment", "connector.request", 1],
          ["increment", "ship.outgoing.users", 1],
          ["increment", "ship.service_api.call", 1]
        ],
        platformApiCalls: []
      });
    });
  });

  it("User Enters Non Whitelisted Segment. Should not send to slack", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      const updateMessages = _.cloneDeep(require("./fixtures/notifier-payloads/update-entity"));
      const private_settings = {
        ...updateMessages.connector.private_settings,
        notify_events: [
          {
            "synchronized_segment": "random",
            "text": "{{user.email}} did {{event.event}}",
            "event": "ENTERED_USER_SEGMENT",
            "channel": "channel_0"
          }
        ]
      };
      const message1 =
        {
          "changes": {
            "is_new": false,
            "user": {},
            "account": {},
            "account_segments": {},
            "segments": {
              "entered": [
                {
                  "id": "segment_1",
                  "name": "Segment1"
                }
              ]
            }
          },
          "account": {},
          "user": {
            "id": "1",
          },
          "segments": [],
          "account_segments": [],
          "message_id": "message_1"
        };

      _.set(updateMessages, "messages", [
        message1
      ]);
      _.set(updateMessages.connector, "private_settings", private_settings);
      return _.assign(updateMessages, {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notify",
        channel: "user:update",
        externalApiMock: () => {},
        response: { flow_control: { type: "next", in: 0.1, size: 100, } },
        logs: [
          ["info", "register.success", { "request_id": expect.whatever() }, undefined],
          ["info", "register.success", { "request_id": expect.whatever() }, undefined]
        ],
        firehoseEvents:[],
        metrics: [
          ["increment", "connector.request", 1],
          ["increment", "ship.outgoing.users", 1]
        ],
        platformApiCalls: []
      });
    });
  });
});*/

