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
/*describe("Outgoing Account Enters Segment Tests", () => {

  it("Account enters segment. Should send to slack", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      const updateMessages = _.cloneDeep(require("./fixtures/notifier-payloads/update-entity"));
      const private_settings = {
        ...updateMessages.connector.private_settings,
        notify_events: [
          {
            "synchronized_segment": "user_segment_1",
            "text": "{{user.email}} did {{event.event}}",
            "event": "ENTERED_USER_SEGMENT",
            "channel": "channel_0"
          }
        ],
        notify_account_events: [
          {
            "event": "ENTERED_ACCOUNT_SEGMENT",
            "synchronized_segment": "account_segment_1",
            "channel": "channel_1",
            "text": "{{account.domain}}435  entered Segment 1"
          },
          {
            "event": "ENTERED_ACCOUNT_SEGMENT",
            "synchronized_segment": "account_segment_2",
            "channel": "channel_2",
            "text": "{{account.domain}} [] entered Segment 2"
          },
          {
            "event": "ENTERED_ACCOUNT_SEGMENT",
            "synchronized_segment": "account_segment_3",
            "channel": "channel_3",
            "text": "{{account.domain}} -- entered Segment 3"
          }
        ]
      };
      const message1 =
        {
          "changes": {
            "is_new": false,
            "user": {},
            "account": {},
            "segments": {},
            "account_segments": {
              "entered": [
                {
                  "id": "account_segment_1",
                  "name": "AccountSegment1"
                }
              ]
            }
          },
          "user": {},
          "account": {
            "id": "5bd329d5e2bcf3eeaf000099",
            "domain": "apple.com",
          },
          "segments": [],
          "account_segments": [
            {
              "id": "account_segment_1",
              "name": "AccountSegment1",
              "type": "accounts_segment",
            }
          ],
          "message_id": "message_1"
        };

      _.set(updateMessages, "messages", [
        message1
      ]);
      _.set(updateMessages.connector, "private_settings", private_settings);
      return _.assign(updateMessages, {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notify",
        channel: "account:update",
        externalApiMock: () => {},
        response: { flow_control: { type: "next", in: 0.1, size: 100, } },
        logs: [
          ["info", "register.success", { "request_id": expect.whatever() }, undefined],
          ["info", "register.success", { "request_id": expect.whatever() }, undefined],
          ["info", "outgoing.account.success",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_id": "5bd329d5e2bcf3eeaf000099",
              "account_domain": "apple.com"
            },
            { "text": expect.whatever(), "channel": "channel_1" }
          ]
        ],
        firehoseEvents:[],
        metrics: [
          ["increment", "connector.request", 1],
          ["increment", "ship.outgoing.account", 1],
          ["increment", "ship.outgoing.account", 1],
          ["increment", "ship.outgoing.account", 1],
          ["increment", "ship.service_api.call", 1]
        ],
        platformApiCalls: []
      });
    });
  });

  it("Account Enters 'ALL' Whitelisted Segment. Should send to slack", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      const updateMessages = _.cloneDeep(require("./fixtures/notifier-payloads/update-entity"));
      const private_settings = {
        ...updateMessages.connector.private_settings,
        notify_events: [
          {
            "synchronized_segment": "user_segment_1",
            "text": "{{user.email}} did {{event.event}}",
            "event": "ENTERED_USER_SEGMENT",
            "channel": "channel_0"
          }
        ],
        notify_account_events: [
          {
            "event": "ENTERED_ACCOUNT_SEGMENT",
            "synchronized_segment": "account_segment_1",
            "channel": "channel_1",
            "text": "{{account.domain}}435  Entered Segment 1"
          },
          {
            "event": "ENTERED_ACCOUNT_SEGMENT",
            "synchronized_segment": "ALL",
            "channel": "channel_2",
            "text": "{{account.domain}} [] Entered All Segment"
          },
          {
            "event": "ENTERED_ACCOUNT_SEGMENT",
            "synchronized_segment": "account_segment_3",
            "channel": "channel_3",
            "text": "{{account.domain}} -- Entered Segment 3"
          }
        ]
      };
      const message1 =
        {
          "changes": {
            "is_new": false,
            "user": {},
            "account": {},
            "segments": {},
            "account_segments": {
              "entered": [
                {
                  "id": "random",
                  "name": "Random"
                },
                {
                  "id": "random_2",
                  "name": "Random2"
                }
              ]
            }
          },
          "user": {},
          "account": {
            "id": "5bd329d5e2bcf3eeaf000099",
            "domain": "apple.com",
          },
          "segments": [],
          "account_segments": [
            {
              "id": "account_segment_1",
              "name": "AccountSegment1",
              "type": "accounts_segment",
            }
          ],
          "message_id": "message_1"
        };

      _.set(updateMessages, "messages", [
        message1
      ]);
      _.set(updateMessages.connector, "private_settings", private_settings);
      return _.assign(updateMessages, {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notify",
        channel: "account:update",
        externalApiMock: () => {},
        response: { flow_control: { type: "next", in: 0.1, size: 100, } },
        logs: [
          ["info", "register.success", { "request_id": expect.whatever() }, undefined],
          ["info", "register.success", { "request_id": expect.whatever() }, undefined],
          ["info", "outgoing.account.success",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_id": "5bd329d5e2bcf3eeaf000099",
              "account_domain": "apple.com"
            },
            { "text": expect.whatever(), "channel": "channel_2" }
          ],
          ["info", "outgoing.account.success",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_id": "5bd329d5e2bcf3eeaf000099",
              "account_domain": "apple.com"
            },
            { "text": expect.whatever(), "channel": "channel_2" }
          ]
        ],
        firehoseEvents:[],
        metrics: [
          ["increment", "connector.request", 1],
          ["increment", "ship.outgoing.account", 1],
          ["increment", "ship.outgoing.account", 1],
          ["increment", "ship.outgoing.account", 1],
          ["increment", "ship.service_api.call", 1],
          ["increment", "ship.service_api.call", 1]
        ],
        platformApiCalls: []
      });
    });
  });

  it("Account Enters Non Whitelisted Segment. Should not send to slack", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      const updateMessages = _.cloneDeep(require("./fixtures/notifier-payloads/update-entity"));
      const private_settings = {
        ...updateMessages.connector.private_settings,
        notify_events: [
          {
            "synchronized_segment": "user_segment_1",
            "text": "{{user.email}} did {{event.event}}",
            "event": "ENTERED_USER_SEGMENT",
            "channel": "channel_0"
          }
        ],
        notify_account_events: [
          {
            "event": "ENTERED_ACCOUNT_SEGMENT",
            "synchronized_segment": "account_segment_1",
            "channel": "channel_1",
            "text": "{{account.domain}}435  entered Segment"
          },
          {
            "event": "ENTERED_ACCOUNT_SEGMENT",
            "synchronized_segment": "account_segment_2",
            "channel": "channel_2",
            "text": "{{account.domain}} [] entered Segment"
          },
          {
            "event": "ENTERED_ACCOUNT_SEGMENT",
            "synchronized_segment": "account_segment_3",
            "channel": "channel_3",
            "text": "{{account.domain}} -- entered Segment"
          }
        ]
      };
      const message1 =
        {
          "changes": {
            "is_new": false,
            "user": {},
            "account": {},
            "segments": {},
            "account_segments": {
              "entered": [
                {
                  "id": "random",
                  "name": "Random"
                }
              ]
            }
          },
          "user": {},
          "account": {
            "id": "5bd329d5e2bcf3eeaf000099",
            "domain": "apple.com",
          },
          "segments": [],
          "account_segments": [
            {
              "id": "account_segment_1",
              "name": "AccountSegment1",
              "type": "accounts_segment",
            }
          ],
          "message_id": "message_1"
        };

      _.set(updateMessages, "messages", [
        message1
      ]);
      _.set(updateMessages.connector, "private_settings", private_settings);
      return _.assign(updateMessages, {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notify",
        channel: "account:update",
        externalApiMock: () => {},
        response: { flow_control: { type: "next", in: 0.1, size: 100, } },
        logs: [
          ["info", "register.success", { "request_id": expect.whatever() }, undefined],
          ["info", "register.success", { "request_id": expect.whatever() }, undefined],
        ],
        firehoseEvents:[],
        metrics: [
          ["increment", "connector.request", 1],
          ["increment", "ship.outgoing.account", 1],
          ["increment", "ship.outgoing.account", 1],
          ["increment", "ship.outgoing.account", 1]
        ],
        platformApiCalls: []
      });
    });
  });
});
*/
