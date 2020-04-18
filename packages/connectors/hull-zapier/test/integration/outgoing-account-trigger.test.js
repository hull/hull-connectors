/* @flow */
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";
const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../server/config";

describe("Outgoing Account Tests", () => {

  it("Account Enters Segment. Should Send To Zapier", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      const updateMessages = _.cloneDeep(require("./fixtures/notifier-payloads/update-single-account"));
      const private_settings = {
        ...updateMessages.connector.private_settings,
        triggers: [
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-entered-segment/1"
            },
            inputData: {
              entered_account_segments: [ "account_segment_1", "account_segment_212341324" ]
            }
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
                },
                {
                  "id": "random",
                  "name": "RandomSegment1"
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
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock("https://hooks.zapier.com/hooks/standard/5687326");

          scope
            .post("/account-entered-segment/1")
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
          ["info", "outgoing.job.start", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "account" }],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            expect.objectContaining({"url": "https://hooks.zapier.com/hooks/standard/5687326/account-entered-segment/1", "method": "POST"})
          ],
          ["info", "outgoing.account.success",
            expect.objectContaining({ "subject_type": "account", "account_id": "5bd329d5e2bcf3eeaf000099" }),
            expect.objectContaining({ "data": {
                "changes": {
                  "account_segments": {
                    "entered": [
                      {
                        "id": "account_segment_1",
                        "name": "AccountSegment1"
                      }
                    ]
                  }
                },
                "account": {
                  "id": "5bd329d5e2bcf3eeaf000099",
                  "domain": "apple.com",
                },
                "account_segments": [
                  {
                    "id": "account_segment_1",
                    "name": "AccountSegment1",
                    "type": "accounts_segment",
                  }
                ],
                "message_id": "message_1"
              }, "type": "Account" })
          ],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "account" }]
        ],
        firehoseEvents:[],
        metrics: [["increment", "connector.request", 1,], ["increment", "ship.service_api.call", 1,], ["value", "connector.service_api.response_time", expect.whatever()]],
        platformApiCalls: []
      });
    });
  });

  it("Account Leaves Segment. Should Send To Zapier", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      const updateMessages = _.cloneDeep(require("./fixtures/notifier-payloads/update-single-account"));
      const private_settings = {
        ...updateMessages.connector.private_settings,
        triggers: [
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-left-segment/1"
            },
            inputData: {
              left_account_segments: [ "account_segment_1", "account_segment_212341324" ]
            }
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
              "left": [
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
              "id": "account_segment_2",
              "name": "AccountSegment2",
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
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock("https://hooks.zapier.com/hooks/standard/5687326");

          scope
            .post("/account-left-segment/1")
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
          ["info", "outgoing.job.start", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "account" }],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            expect.objectContaining({"url": "https://hooks.zapier.com/hooks/standard/5687326/account-left-segment/1", "method": "POST"})
          ],
          ["info", "outgoing.account.success",
            expect.objectContaining({ "subject_type": "account", "account_id": "5bd329d5e2bcf3eeaf000099" }),
            expect.objectContaining({ "data": {
                "changes": {
                  "account_segments": {
                    "left": [
                      {
                        "id": "account_segment_1",
                        "name": "AccountSegment1"
                      }
                    ]
                  }
                },
                "account": {
                  "id": "5bd329d5e2bcf3eeaf000099",
                  "domain": "apple.com",
                },
                "account_segments": [
                  {
                    "id": "account_segment_2",
                    "name": "AccountSegment2",
                    "type": "accounts_segment",
                  }
                ],
                "message_id": "message_1"
              }, "type": "Account" })
          ],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "account" }]
        ],
        firehoseEvents:[],
        metrics: [["increment", "connector.request", 1,], ["increment", "ship.service_api.call", 1,], ["value", "connector.service_api.response_time", expect.whatever()]],
        platformApiCalls: []
      });
    });
  });

  it("Whitelisted Account Attribute Changed. Should Send To Zapier", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      const updateMessages = _.cloneDeep(require("./fixtures/notifier-payloads/update-single-account"));
      const private_settings = {
        ...updateMessages.connector.private_settings,
        triggers: [
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-attribute-updated/1"
            },
            inputData: {
              account_attribute_updated: [ "pipedrive/industry" ],
              account_segments: [ "all_segments" ]
            }
          },
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-attribute-updated/1"
            },
            inputData: {
              account_attribute_updated: [ "random" ],
              account_segments: [ "all_segments" ]
            }
          }
        ]
      };
      const message1 =
        {
          "changes": {
            "is_new": false,
            "account": {
              "pipedrive/industry": ["something", "it"],
              "pipedrive/rand_1": ["something", "it"],
              "pipedrive/rand_2": ["something", "it"],
              "pipedrive/rand_3": ["something", "it"]
            },
            "user": {},
            "account_segments": {},
            "segments": {}
          },
          "account": {
            "id": "5bd329d5e2bcf3eeaf000099",
            "name": "Apple",
            "email": "apple.com",
            "pipedrive/industry": "it"
          },
          "user": {},
          "account_segments": [
            {
              "id": "account_segment_1",
              "name": "AccountSegment1",
              "type": "accounts_segment",
            }
          ],
          "segments": [],
          "message_id": "message_1"
        };

      _.set(updateMessages, "messages", [
        message1
      ]);
      _.set(updateMessages.connector, "private_settings", private_settings);
      return _.assign(updateMessages, {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock("https://hooks.zapier.com/hooks/standard/5687326");

          scope
            .post("/account-attribute-updated/1")
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
          ["info", "outgoing.job.start", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "account" }],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            expect.objectContaining({"url": "https://hooks.zapier.com/hooks/standard/5687326/account-attribute-updated/1", "method": "POST"})
          ],
          ["info", "outgoing.account.success",
            expect.objectContaining({ "subject_type": "account", "account_id": "5bd329d5e2bcf3eeaf000099" }),
            expect.objectContaining({ "data": {
                "changes": {
                  "account": {
                    "pipedrive/industry": ["something", "it"]
                  }
                },
                "account": {
                  "id": "5bd329d5e2bcf3eeaf000099",
                  "name": "Apple",
                  "email": "apple.com",
                  "pipedrive/industry": "it"
                },
                "account_segments": [
                  {
                    "id": "account_segment_1",
                    "name": "AccountSegment1",
                    "type": "accounts_segment",
                  }
                ],
                "message_id": "message_1"
              }, "type": "Account" })
          ],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "account" }]
        ],
        firehoseEvents:[],
        metrics: [["increment", "connector.request", 1,], ["increment", "ship.service_api.call", 1,], ["value", "connector.service_api.response_time", expect.whatever()]],
        platformApiCalls: []
      });
    });
  });

  it("New Account in Whitelisted Segment. Should Send to Zapier", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      const updateMessages = _.cloneDeep(require("./fixtures/notifier-payloads/update-single-account"));
      const private_settings = {
        ...updateMessages.connector.private_settings,
        triggers: [
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-attribute-updated/1"
            },
            inputData: {
              account_attribute_updated: [ "random" ],
              account_segments: [ "account_segment_1", "account_segment_3" ]
            }
          },
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-created/1"
            },
            inputData: {
              is_new_account: true,
              account_segments: [ "account_segment_1", "account_segment_3" ]
            }
          },
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-created/2"
            },
            inputData: {
              is_new_account: true,
              account_segments: ["account_segment_2", "account_segment_500"]
            }
          }
        ]
      };
      const message1 =
        {
          "changes": {
            "is_new": true,
            "account": {
              "pipedrive/industry": ["something", "it"],
              "pipedrive/rand_1": ["something", "it"],
              "pipedrive/rand_2": ["something", "it"],
              "pipedrive/rand_3": ["something", "it"]
            },
            "user": {},
            "account_segments": {},
            "segments": {}
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
            },
            {
              "id": "account_segment_2",
              "name": "AccountSegment2",
              "type": "accounts_segment",
            },
            {
              "id": "account_segment_3",
              "name": "AccountSegment3",
              "type": "accounts_segment",
            },
            {
              "id": "account_segment_4",
              "name": "AccountSegment5",
              "type": "accounts_segment",
            },
            {
              "id": "account_segment_5",
              "name": "AccountSegment5",
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
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock("https://hooks.zapier.com/hooks/standard/5687326");

          scope
            .post("/account-created/1")
            .reply(200, {
              "status": "success",
              "attempt": "1",
              "id": "1",
              "request_id": "1"
            });

          scope
            .post("/account-created/2")
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
          ["info", "outgoing.job.start", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "account" }],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            expect.objectContaining({"url": "https://hooks.zapier.com/hooks/standard/5687326/account-created/1", "method": "POST"})
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            expect.objectContaining({"url": "https://hooks.zapier.com/hooks/standard/5687326/account-created/2", "method": "POST"})
          ],
          ["info", "outgoing.account.success",
            expect.objectContaining({ "subject_type": "account", "account_id": "5bd329d5e2bcf3eeaf000099" }),
            expect.objectContaining({ "data": {
                "changes": {
                  "is_new": true
                },
                "account": {
                  "id": "5bd329d5e2bcf3eeaf000099",
                  "domain": "apple.com",
                },
                "account_segments": [
                  {
                    "id": "account_segment_1",
                    "name": "AccountSegment1",
                    "type": "accounts_segment",
                  },
                  {
                    "id": "account_segment_2",
                    "name": "AccountSegment2",
                    "type": "accounts_segment",
                  },
                  {
                    "id": "account_segment_3",
                    "name": "AccountSegment3",
                    "type": "accounts_segment",
                  },
                  {
                    "id": "account_segment_4",
                    "name": "AccountSegment5",
                    "type": "accounts_segment",
                  },
                  {
                    "id": "account_segment_5",
                    "name": "AccountSegment5",
                    "type": "accounts_segment",
                  }
                ],
                "message_id": "message_1"
              }, "type": "Account" })
          ],
          ["info", "outgoing.account.success",
            expect.objectContaining({ "subject_type": "account", "account_id": "5bd329d5e2bcf3eeaf000099" }),
            expect.objectContaining({ "data": expect.objectContaining({"message_id": "message_1"}), "type": "Account" })
          ],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "account" }]
        ],
        firehoseEvents:[],
        metrics: [["increment", "connector.request", 1,], ["increment", "ship.service_api.call", 1,], ["increment", "ship.service_api.call", 1,], ["value", "connector.service_api.response_time", expect.whatever()], ["value", "connector.service_api.response_time", expect.whatever()]],
        platformApiCalls: []
      });
    });
  });

  it("Send Single Account To Multiple Zaps", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      const updateMessages = _.cloneDeep(require("./fixtures/notifier-payloads/update-single-account"));
      const private_settings = {
        ...updateMessages.connector.private_settings,
        triggers: [
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-attribute-updated/1"
            },
            inputData: {
              account_attribute_updated: [ "pipedrive/industry" ],
              account_segments: [ "account_segment_1", "account_segment_2" ]
            }
          },
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-attribute-updated/2"
            },
            inputData: {
              account_attribute_updated: [ "pipedrive/industry" ],
              account_segments: [ "random", "random_1" ]
            }
          },
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-entered-segment/1"
            },
            inputData: {
              entered_account_segments: [ "all_segments" ]
            }
          },
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-left-segment/1"
            },
            inputData: {
              left_account_segments: [ "all_segments" ]
            }
          }
        ]
      };
      const message1 =
        {
          "changes": {
            "is_new": false,
            "user": {},
            "account": {
              "pipedrive/industry": ["marketing", "sales"],
              "blacklistattr_1": ["", "1"],
              "blacklistattr_2": ["", "1"],
              "blacklistattr_3": ["", "1"]
            },
            "segments": {},
            "account_segments": {
              "left": [
                {
                  "id": "account_segment_3",
                  "name": "AccountSegment3"
                }
              ],
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
            "domain": "apple.com"
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
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock("https://hooks.zapier.com/hooks/standard/5687326");

          scope
            .post("/account-attribute-updated/1")
            .reply(200, {
              "status": "success",
              "attempt": "1",
              "id": "1",
              "request_id": "1"
            });

          scope
            .post("/account-entered-segment/1")
            .reply(200, {
              "status": "success",
              "attempt": "1",
              "id": "1",
              "request_id": "1"
            });

          scope
            .post("/account-left-segment/1")
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
          ["info", "outgoing.job.start", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "account" }],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            expect.objectContaining({"url": "https://hooks.zapier.com/hooks/standard/5687326/account-attribute-updated/1", "method": "POST"})
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            expect.objectContaining({"url": "https://hooks.zapier.com/hooks/standard/5687326/account-entered-segment/1", "method": "POST"})
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            expect.objectContaining({"url": "https://hooks.zapier.com/hooks/standard/5687326/account-left-segment/1", "method": "POST"})
          ],
          ["info", "outgoing.account.success",
            expect.objectContaining({ "subject_type": "account", "account_id": "5bd329d5e2bcf3eeaf000099" }),
            expect.objectContaining({ "data": expect.objectContaining({"message_id": "message_1"}), "type": "Account" })
          ],
          ["info", "outgoing.account.success",
            expect.objectContaining({ "subject_type": "account", "account_id": "5bd329d5e2bcf3eeaf000099" }),
            expect.objectContaining({ "data": expect.objectContaining({"message_id": "message_1"}), "type": "Account" })
          ],
          ["info", "outgoing.account.success",
            expect.objectContaining({ "subject_type": "account", "account_id": "5bd329d5e2bcf3eeaf000099" }),
            expect.objectContaining({ "data": expect.objectContaining({"message_id": "message_1"}), "type": "Account" })
          ],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "account" }]
        ],
        firehoseEvents:[],
        metrics: [
          ["increment", "connector.request", 1,],
          ["increment", "ship.service_api.call", 1,], ["value", "connector.service_api.response_time", expect.whatever()],
          ["increment", "ship.service_api.call", 1,], ["value", "connector.service_api.response_time", expect.whatever()],
          ["increment", "ship.service_api.call", 1,], ["value", "connector.service_api.response_time", expect.whatever()],
        ],
        platformApiCalls: []
      });
    });
  });

  it("Send Multiple Accounts To Zapier", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      const updateMessages = _.cloneDeep(require("./fixtures/notifier-payloads/update-single-account"));
      const private_settings = {
        ...updateMessages.connector.private_settings,
        triggers: [
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-attribute-updated/1"
            },
            inputData: {
              account_attribute_updated: [ "pipedrive/industry" ],
              account_segments: [ "account_segment_1", "account_segment_2" ]
            }
          },
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-attribute-updated/2"
            },
            inputData: {
              account_attribute_updated: [ "pipedrive/industry" ],
              account_segments: [ "account_segment_11", "account_segment_12" ]
            }
          },
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-entered-segment/1"
            },
            inputData: {
              entered_account_segments: [ "account_segment_1", "account_segment_2" ]
            }
          },
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-left-segment/1"
            },
            inputData: {
              left_account_segments: [ "account_segment_1", "account_segment_3" ]
            }
          }
        ]
      };
      const message1 =
        {
          "changes": {
            "is_new": false,
            "user": {},
            "account": {
              "pipedrive/industry": ["marketing", "sales"],
              "blacklistattr_1": ["", "1"],
              "blacklistattr_2": ["", "1"],
              "blacklistattr_3": ["", "1"]
            },
            "account_segments": {},
            "segments": {}
          },
          "user": {},
          "account": {
            "id": "5bd329d5e2bcf3eeaf000099",
            "domain": "apple.com"
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

      const message2 = _.cloneDeep(message1);
      _.set(message2, "message_id", "message_2");
      _.set(message2, "changes", {
        "account_segments": {
          "entered": [
            {
              "id": "account_segment_1",
              "name": "AccountSegment1"
            }
          ]
        }
      });

      const message3 = _.cloneDeep(message1);
      _.set(message3, "message_id", "message_3");
      _.set(message3, "changes", {
        "account_segments": {
          "left": [
            {
              "id": "account_segment_3",
              "name": "AccountSegment3"
            }
          ]
        }
      });

      _.set(updateMessages, "messages", [
        message1,
        message2,
        message3
      ]);
      _.set(updateMessages.connector, "private_settings", private_settings);

      return _.assign(updateMessages, {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {
          const scope = nock("https://hooks.zapier.com/hooks/standard/5687326");

          scope
            .post("/account-attribute-updated/1")
            .reply(200, {
              "status": "success",
              "attempt": "1",
              "id": "1",
              "request_id": "1"
            });

          scope
            .post("/account-entered-segment/1")
            .reply(200, {
              "status": "success",
              "attempt": "1",
              "id": "1",
              "request_id": "1"
            });

          scope
            .post("/account-left-segment/1")
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
          ["info", "outgoing.job.start", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "account" }],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            expect.objectContaining({"url": "https://hooks.zapier.com/hooks/standard/5687326/account-attribute-updated/1", "method": "POST"})
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            expect.objectContaining({"url": "https://hooks.zapier.com/hooks/standard/5687326/account-entered-segment/1", "method": "POST"})
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            expect.objectContaining({"url": "https://hooks.zapier.com/hooks/standard/5687326/account-left-segment/1", "method": "POST"})
          ],
          ["info", "outgoing.account.success",
            expect.objectContaining({ "subject_type": "account",  "account_domain": "apple.com", "account_id": "5bd329d5e2bcf3eeaf000099" }),
            expect.objectContaining({ "data": expect.objectContaining({"message_id": "message_1"}), "type": "Account" })
          ],
          ["info", "outgoing.account.success",
            expect.objectContaining({ "subject_type": "account",  "account_domain": "apple.com", "account_id": "5bd329d5e2bcf3eeaf000099" }),
            expect.objectContaining({ "data": expect.objectContaining({"message_id": "message_2"}), "type": "Account" })
          ],
          ["info", "outgoing.account.success",
            expect.objectContaining({ "subject_type": "account",  "account_domain": "apple.com", "account_id": "5bd329d5e2bcf3eeaf000099" }),
            expect.objectContaining({ "data": expect.objectContaining({"message_id": "message_3"}), "type": "Account" })
          ],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "account" }]
        ],
        firehoseEvents:[],
        metrics: [
          ["increment", "connector.request", 1,], ["increment", "ship.service_api.call", 1,], ["value", "connector.service_api.response_time", expect.whatever()],
          ["increment", "ship.service_api.call", 1,], ["value", "connector.service_api.response_time", expect.whatever()],
          ["increment", "ship.service_api.call", 1,], ["value", "connector.service_api.response_time", expect.whatever()],
        ],
        platformApiCalls: []
      });
    });
  });

  it("Account enters non-whitelisted segment but is in whitelisted segment. Should not send to zapier.", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      const updateMessages = _.cloneDeep(require("./fixtures/notifier-payloads/update-single-account"));
      const private_settings = {
        ...updateMessages.connector.private_settings,
        triggers: [
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-entered-segment/1"
            },
            inputData: {
              entered_account_segments: [ "account_segment_1", "account_segment_2" ]
            }
          }
        ]
      };
      const message1 =
        {
          "changes": {
            "is_new": false,
            "account": {},
            "user": {},
            "segments": {},
            "account_segments": {
              "left": [],
              "entered": [
                {
                  "id": "account_segment_3",
                  "name": "AccountSegment3"
                }
              ]
            }
          },
          "user": {},
          "account": {
            "id": "5bd329d5e2bcf3eeaf000099",
            "domain": "apple.com"
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
        handlerUrl: "smart-notifier",
        channel: "account:update",
        externalApiMock: () => {},
        response: { flow_control: { type: "next", in: 5, in_time: 10, size: 10, } },
        logs: [
          ["info", "outgoing.job.start", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "account" }],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "account" }]
        ],
        firehoseEvents:[],
        metrics: [
          ["increment", "connector.request", 1,],
        ],
        platformApiCalls: []
      });
    });
  });

  /*it("Webhook Not Valid - Should Unsubscribe", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {

    });
  });*/
});
