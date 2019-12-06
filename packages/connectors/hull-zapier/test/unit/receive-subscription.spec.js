/* @flow */
const _ = require("lodash");

const { PurpleFusionTestHarness } = require("hull-connector-framework/src/purplefusiontester/purplefusion-test-harness");

describe("Zapier Subscription Tests", () => {

  const testDefinition = require("./fixtures/subscribe");

  const harness = new PurpleFusionTestHarness(
    require("../../server/glue"),
    {
      zapier: require("../../server/service")()
    },
    _.concat(
      require("../../server/transforms-to-hull"),
      require("../../server/transforms-to-service")
    ),
    "");


  it("Receive New Subscription", () => {
    const subscribe = _.cloneDeep(testDefinition);
    subscribe.input.data = {
      body: {
        "url": "https://hooks.zapier.com/hooks/standard/1/1/",
        "action": "entered_segment",
        "entityType": "user",
        "inputData": {
          "user_segments": ["all_segments"]
        }
      }
    };
    subscribe.serviceRequests[0].input = {
      "triggers": [
        {
          "serviceAction": {
            "webhook": "https://hooks.zapier.com/hooks/standard/1/1/"
          },
          "inputData": {
            "entered_user_segments": ["all_segments"]
          }
        }
      ]
    };
    return harness.runTest(subscribe);
  });

  it("Receive New Subscription And Merge With Existing Subscriptions", () => {
    const subscribe = _.cloneDeep(testDefinition);
    subscribe.configuration.private_settings.triggers = [
      {
        "serviceAction": {
          "webhook": "https://hooks.zapier.com/hooks/standard/1/1/"
        },
        "inputData": {
          "entered_user_segments": ["all_segments"]
        }
      }
    ];
    subscribe.input.data = {
      body: {
        "url": "https://hooks.zapier.com/hooks/standard/1/2/",
        "action": "entered_segment",
        "entityType": "user",
        "inputData": {
          "user_segments": ["user_segment_1"]
        }
      }
    };
    subscribe.serviceRequests[0].input = {
      "triggers": [
        {
          "serviceAction": {
            "webhook": "https://hooks.zapier.com/hooks/standard/1/1/"
          },
          "inputData": {
            "entered_user_segments": ["all_segments"]
          }
        },
        {
          "serviceAction": {
            "webhook": "https://hooks.zapier.com/hooks/standard/1/2/"
          },
          "inputData": {
            "entered_user_segments": ["user_segment_1"]
          }
        }
      ]
    };
    return harness.runTest(subscribe);
  });

  it("Receive New Subscription And Unable To Merge With Existing Subscriptions", () => {
    const subscribe = _.cloneDeep(testDefinition);
    subscribe.configuration.private_settings.triggers = [
      {
        "serviceAction": {
          "webhook": "https://hooks.zapier.com/hooks/standard/1/1/"
        },
        "inputData": {
          "entered_user_segments": ["all_segments"]
        }
      }
    ];
    subscribe.input.data = {
      body: {
        "url": "https://hooks.zapier.com/hooks/standard/1/1/",
        "action": "entered_segment",
        "entityType": "user",
        "inputData": {
          "user_segments": ["user_segment_1"]
        }
      }
    };
    subscribe.serviceRequests = [];
    return harness.runTest(subscribe);
  });
});
