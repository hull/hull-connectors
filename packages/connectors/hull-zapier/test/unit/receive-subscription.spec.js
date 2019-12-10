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


  it("Receive User Entered Segment Subscription", () => {
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

  it("Receive User Left Segment Subscription", () => {
    const subscribe = _.cloneDeep(testDefinition);
    subscribe.input.data = {
      body: {
        "url": "https://hooks.zapier.com/hooks/standard/1/1/",
        "action": "left_segment",
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
            "left_user_segments": ["all_segments"]
          }
        }
      ]
    };
    return harness.runTest(subscribe);
  });

  it("Receive User Attribute Updated Subscription Subscription With All Valid Fields", () => {
    const subscribe = _.cloneDeep(testDefinition);
    subscribe.input.data = {
      body: {
        "url": "https://hooks.zapier.com/hooks/standard/1/1/",
        "action": "attribute_updated",
        "entityType": "user",
        "inputData": {
          "user_segments": [ "segment_1" ],
          "account_segments": [ "account_segment_1" ],
          "user_attributes": [ "pipedrive/department" ],
          "account_attributes": [ "pipedrive/industry", "num_employees" ]
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
            "user_segments": [ "segment_1" ],
            "account_segments": [ "account_segment_1" ],
            "user_attribute_updated": [ "pipedrive/department" ],
            "account_attribute_updated": [ "pipedrive/industry", "num_employees" ]
          }
        }
      ]
    };
    return harness.runTest(subscribe);
  });

  it("Receive User Attribute Updated Subscription Subscription With No Account Attributes", () => {
    const subscribe = _.cloneDeep(testDefinition);
    subscribe.input.data = {
      body: {
        "url": "https://hooks.zapier.com/hooks/standard/1/1/",
        "action": "attribute_updated",
        "entityType": "user",
        "inputData": {
          "user_segments": [ "segment_1" ],
          "account_segments": [ "account_segment_1" ],
          "user_attributes": [ "pipedrive/department" ],
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
            "user_segments": [ "segment_1" ],
            "account_segments": [ "account_segment_1" ],
            "user_attribute_updated": [ "pipedrive/department" ]
          }
        }
      ]
    };
    return harness.runTest(subscribe);
  });

  it("Receive User Attribute Updated Subscription Subscription With No User Attributes", () => {
    const subscribe = _.cloneDeep(testDefinition);
    subscribe.input.data = {
      body: {
        "url": "https://hooks.zapier.com/hooks/standard/1/1/",
        "action": "attribute_updated",
        "entityType": "user",
        "inputData": {
          "user_segments": [ "segment_1" ],
          "account_segments": [ "account_segment_1" ],
          "account_attributes": [ "pipedrive/industry", "num_employees" ]
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
            "user_segments": [ "segment_1" ],
            "account_segments": [ "account_segment_1" ],
            "account_attribute_updated": [ "pipedrive/industry", "num_employees" ]
          }
        }
      ]
    };
    return harness.runTest(subscribe);
  });

  it("Receive User Event Created Subscription Subscription", () => {
    const subscribe = _.cloneDeep(testDefinition);
    subscribe.input.data = {
      body: {
        "url": "https://hooks.zapier.com/hooks/standard/1/1/",
        "action": "created",
        "entityType": "user_event",
        "inputData": {
          "user_segments": [ "segment_1" ],
          "account_segments": [ "account_segment_1" ],
          "user_events": [ "Email Opened" ]
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
            "user_segments": [ "segment_1" ],
            "account_segments": [ "account_segment_1" ],
            "user_events": [ "Email Opened" ]
          }
        }
      ]
    };
    return harness.runTest(subscribe);
  });

  it("Receive User Created Subscription Subscription", () => {
    const subscribe = _.cloneDeep(testDefinition);
    subscribe.input.data = {
      body: {
        "url": "https://hooks.zapier.com/hooks/standard/1/1/",
        "action": "created",
        "entityType": "user",
        "inputData": {
          "user_segments": [ "segment_1" ]
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
            "is_new": true,
            "user_segments": [ "segment_1" ]
          }
        }
      ]
    };
    return harness.runTest(subscribe);
  });

  it("Receive Account Entered Segment Subscription", () => {
    const subscribe = _.cloneDeep(testDefinition);
    subscribe.input.data = {
      body: {
        "url": "https://hooks.zapier.com/hooks/standard/1/1/",
        "action": "entered_segment",
        "entityType": "account",
        "inputData": {
          "account_segments": ["all_segments"]
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
            "entered_account_segments": ["all_segments"]
          }
        }
      ]
    };
    return harness.runTest(subscribe);
  });

  it("Receive Account Left Segment Subscription", () => {
    const subscribe = _.cloneDeep(testDefinition);
    subscribe.input.data = {
      body: {
        "url": "https://hooks.zapier.com/hooks/standard/1/1/",
        "action": "left_segment",
        "entityType": "account",
        "inputData": {
          "account_segments": ["all_segments"]
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
            "left_account_segments": ["all_segments"]
          }
        }
      ]
    };
    return harness.runTest(subscribe);
  });

  it("Receive Account Attribute Updated Subscription Subscription", () => {
    const subscribe = _.cloneDeep(testDefinition);
    subscribe.input.data = {
      body: {
        "url": "https://hooks.zapier.com/hooks/standard/1/1/",
        "action": "attribute_updated",
        "entityType": "account",
        "inputData": {
          "account_segments": [ "account_segment_1" ],
          "account_attributes": [ "pipedrive/industry", "num_employees" ]
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
            "account_segments": [ "account_segment_1" ],
            "account_attribute_updated": [ "pipedrive/industry", "num_employees" ]
          }
        }
      ]
    };
    return harness.runTest(subscribe);
  });

  it("Receive Account Created Subscription Subscription", () => {
    const subscribe = _.cloneDeep(testDefinition);
    subscribe.input.data = {
      body: {
        "url": "https://hooks.zapier.com/hooks/standard/1/1/",
        "action": "created",
        "entityType": "account",
        "inputData": {
          "account_segments": [ "segment_1" ]
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
            "is_new": true,
            "account_segments": [ "segment_1" ]
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
