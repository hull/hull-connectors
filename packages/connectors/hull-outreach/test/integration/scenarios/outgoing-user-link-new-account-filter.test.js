// @flow
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";

/* global describe, it, beforeEach, afterEach */
const testScenario = require("hull-connector-framework/src/test-scenario");
const connectorServer = require("../../../server/server");

// This test simulates when a user is not in a segment
// but an account change is detected, in this case a user still
// shouldn't be sent
test("should not link account in outreach if user is not in segment", () => {
  return testScenario({ connectorServer }, ({ handlers, nock, expect }) => {
    const updateMessages = _.cloneDeep(require("../fixtures/notifier-payloads/outgoing-user-link-new-account.json"));
    updateMessages.connector.private_settings.synchronized_user_segments = [];
    _.set(updateMessages.messages[0], "changes.account.id", [
                        null,
                        "someid"
                    ]);
    return _.assign(updateMessages, {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("https://api.outreach.io");
        return scope;
      },
      response: {
        flow_control: {
          type: "next",
          in: 5,
          in_time: 10,
          size: 10,
        }
      },
      logs: [
        ["info", "outgoing.job.start", {"request_id": expect.whatever()}, {"jobName": "Outgoing Data", "type": "user"}],
        ["info", "outgoing.user.skip", {"request_id": expect.whatever(), "subject_type": "user", "user_email": "fettisbest@gmail.com", "user_id": "5bd329d5e2bcf3eeaf00009f"}, {"reason": "User is not present in any of the defined segments to send to service.  Please either add a new synchronized segment which the user is present in the settings page, or add the user to an existing synchronized segment"}],
        ["info", "outgoing.job.success", {"request_id": expect.whatever()}, {"jobName": "Outgoing Data", "type": "user"}]
      ],
      firehoseEvents: [],
      metrics: [["increment", "connector.request", 1]]
    });
  });
});
