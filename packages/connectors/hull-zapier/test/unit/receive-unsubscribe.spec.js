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
    unsubscribe.configuration.private_settings.subscriptions = [
      {
        "url": "https://hooks.zapier.com/hooks/standard/1/1/",
        "action": "entered_segment",
        "entityType": "user"
      },
      {
        "url": "https://hooks.zapier.com/hooks/standard/1/2/",
        "action": "entered_segment",
        "entityType": "user"
      },
      {
        "url": "https://hooks.zapier.com/hooks/standard/1/3/",
        "action": "entered_segment",
        "entityType": "user"
      }
    ];
    unsubscribe.input.data = {
      body: {
        "url": "https://hooks.zapier.com/hooks/standard/1/2/",
        "action": "entered_segment",
        "entityType": "user"
      }
    };
    unsubscribe.serviceRequests[0].input = {
      "subscriptions": [
        {
          "url": "https://hooks.zapier.com/hooks/standard/1/1/",
          "action": "entered_segment",
          "entityType": "user"
        },
        {
          "url": "https://hooks.zapier.com/hooks/standard/1/3/",
          "action": "entered_segment",
          "entityType": "user"
        }
      ]
    };
    return harness.runTest(unsubscribe);
  });

  it("Receive Unsubscribe From Error", () => {
    const unsubscribe = _.cloneDeep(testDefinition);
    _.set(unsubscribe, "route", "unsubscribeFromError");
    unsubscribe.configuration.private_settings.subscriptions = [
      {
        "url": "https://hooks.zapier.com/hooks/standard/1/1/",
        "action": "entered_segment",
        "entityType": "user"
      },
      {
        "url": "https://hooks.zapier.com/hooks/standard/1/2/",
        "action": "entered_segment",
        "entityType": "user"
      },
      {
        "url": "https://hooks.zapier.com/hooks/standard/1/3/",
        "action": "entered_segment",
        "entityType": "user"
      }
    ];
    unsubscribe.input.data = {
      "status": 410,
      "response": {
        "req": {
          "method": "POST",
          "url": "https://hooks.zapier.com/hooks/standard/1/3/",
          "data": {},
          "headers": {}
        },
        "header": {},
        "status": 410,
        "text": "please unsubscribe me!"
      }
    };
    unsubscribe.serviceRequests[0].input = {
      "subscriptions": [
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
    unsubscribe.result = [{"data": {"ok": true}, "status": 200}];
    return harness.runTest(unsubscribe);
  });
});
