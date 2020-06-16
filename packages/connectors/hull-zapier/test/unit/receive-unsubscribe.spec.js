/* @flow */
const _ = require("lodash");

const { PurpleFusionTestHarness } = require("hull-connector-framework/src/purplefusiontester/purplefusion-test-harness");

describe("Zapier Subscription Tests", () => {

  const testDefinition = require("./fixtures/unsubscribe");

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


  it("Receive Unsubscribe", () => {
    const unsubscribe = _.cloneDeep(testDefinition);
    unsubscribe.configuration.private_settings.triggers = [
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
          "entered_user_segments": ["all_segments"]
        }
      },
      {
        "serviceAction": {
          "webhook": "https://hooks.zapier.com/hooks/standard/1/3/"
        },
        "inputData": {
          "entered_user_segments": ["all_segments"]
        }
      }
    ];
    unsubscribe.input.data = {
      body: {
        "url": "https://hooks.zapier.com/hooks/standard/1/2/",
        "action": "entered_segment",
        "entityType": "user",
        "inputData": {
          "user_segments": ["segment_2"]
        }
      }
    };
    unsubscribe.serviceRequests[0].input = {
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
            "webhook": "https://hooks.zapier.com/hooks/standard/1/3/"
          },
          "inputData": {
            "entered_user_segments": ["all_segments"]
          }
        }
      ]
    };
    return harness.runTest(unsubscribe);
  });
});
