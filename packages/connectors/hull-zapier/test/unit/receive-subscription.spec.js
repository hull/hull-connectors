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
        "entityType": "user"
      }
    };
    subscribe.serviceRequests[0].input = {
      "triggers": [
        {
          "url": "https://hooks.zapier.com/hooks/standard/1/1/",
          "action": "entered_segment",
          "entityType": "user"
        }
      ]
    };
    return harness.runTest(subscribe);
  });

  it("Receive New Subscription And Merge With Existing Subscriptions", () => {
    const subscribe = _.cloneDeep(testDefinition);
    subscribe.configuration.private_settings.triggers = [
      {
        "url": "https://hooks.zapier.com/hooks/standard/1/1/",
        "action": "entered_segment",
        "entityType": "user"
      }
    ];
    subscribe.input.data = {
      body: {
        "url": "https://hooks.zapier.com/hooks/standard/1/2/",
        "action": "entered_segment",
        "entityType": "user"
      }
    };
    subscribe.serviceRequests[0].input = {
      "triggers": [
        {
          "url": "https://hooks.zapier.com/hooks/standard/1/1/",
          "action": "entered_segment",
          "entityType": "user"
        },
        {
          "url": "https://hooks.zapier.com/hooks/standard/1/2/",
          "action": "entered_segment",
          "entityType": "user"
        }
      ]
    };
    return harness.runTest(subscribe);
  });

  it("Receive New Subscription And Unable To Merge With Existing Subscriptions", () => {
    const subscribe = _.cloneDeep(testDefinition);
    subscribe.configuration.private_settings.triggers = [
      {
        "url": "https://hooks.zapier.com/hooks/standard/1/1/",
        "action": "entered_segment",
        "entityType": "user"
      }
    ];
    subscribe.input.data = {
      body: {
        "url": "https://hooks.zapier.com/hooks/standard/1/1/",
        "action": "entered_segment",
        "entityType": "user"
      }
    };
    subscribe.serviceRequests = {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "settingsUpdate",
      "input": {},
      "result": {}
    };
    return harness.runTest(subscribe);
  });
});
