/* @flow */
const _ = require("lodash");

const { getEntityTriggers } = require("../../../src/purplefusion/triggers/trigger-utils");
const { ContextMock } = require("../../../src/purplefusiontester/connector-mock");


describe("Outgoing Account Entered Segment Filtering Tests", () => {
  it("Account Entered Valid Segment. Should not filter out entered segment trigger.", () => {
    const context = new ContextMock({ private_settings: {
      "triggers": [
        {
          "serviceAction": {
            "webhook": "https://hooks.zapier.com/hooks/standard/5687326/account-entered-segment/1"
          },
          "inputData": {
            "entered_account_segments": [
              "account_segment_1",
              "account_segment_2"
            ]
          }
        }
      ]
    }});
    const message = {
      "changes": { "account_segments": { "entered": [{ "id": "account_segment_1" }] }
      },
      "account": {
        "id": "1"
      },
      "events": [],
      "account_segments": [],
      "segments": [],
      "message_id": "message_1"
    };
    const triggers = getEntityTriggers(message, context.connector.private_settings.triggers);
    const { serviceAction, cleanedEntity } = triggers[0];

    expect(_.size(triggers)).toEqual(1);
    expect(_.keys(triggers[0])).toEqual(["serviceAction", "cleanedEntity", "rawEntity"]);
    expect(cleanedEntity).toEqual({
      "changes": { "account_segments": { "entered": [{ "id": "account_segment_1" }] } },
      "account": { "id": "1" },
      "account_segments": [],
      "message_id": "message_1"
    });
    expect(serviceAction.webhook).toEqual("https://hooks.zapier.com/hooks/standard/5687326/account-entered-segment/1");
  });

  it("Account Entered 'all_segments'. Should not filter out trigger.", () => {
    const context = new ContextMock({ private_settings: {
        "triggers": [
          {
            "serviceAction": {
              "webhook": "https://hooks.zapier.com/hooks/standard/5687326/account-entered-segment/1"
            },
            "inputData": {
              "entered_account_segments": [
                "all_segments"
              ]
            }
          }
        ]
      }});
    const message = {
      "changes": {
        "account_segments": {
          "entered": [{ "id": "account_segment_1" }, { "id": "account_segment_2" }],
          "left": [{ "id": "account_segment_3" }, { "id": "account_segment_4" }]
        }
      },
      "account": {
        "id": "1"
      },
      "events": [],
      "account_segments": [],
      "segments": [],
      "message_id": "message_1"
    };
    const triggers = getEntityTriggers(message, context.connector.private_settings.triggers);
    const { serviceAction, cleanedEntity } = triggers[0];

    expect(_.size(triggers)).toEqual(1);
    expect(_.keys(triggers[0])).toEqual(["serviceAction", "cleanedEntity", "rawEntity"]);
    expect(cleanedEntity).toEqual({
      "changes": { "account_segments": { "entered": [{ "id": "account_segment_1" }, { "id": "account_segment_2" }] } },
      "account": { "id": "1" },
      "account_segments": [],
      "message_id": "message_1"
    });
    expect(serviceAction.webhook).toEqual("https://hooks.zapier.com/hooks/standard/5687326/account-entered-segment/1");
  });

  it("Account Did Not Enter 'all_segments'. Should filter out trigger.", () => {
    const context = new ContextMock({ private_settings: {
        "triggers": [
          {
            "serviceAction": {
              "webhook": "https://hooks.zapier.com/hooks/standard/5687326/account-entered-segment/1"
            },
            "inputData": {
              "entered_account_segments": [
                "all_segments"
              ]
            }
          }
        ]
      }});
    const message = {
      "changes": { "account_segments": { "entered": [] }
      },
      "account": {
        "id": "1"
      },
      "events": [],
      "account_segments": [],
      "segments": [],
      "message_id": "message_1"
    };
    const triggers = getEntityTriggers(message, context.connector.private_settings.triggers);

    expect(_.size(triggers)).toEqual(0);
  });

  it("Account Entered Segment. Should not filter out trigger and should filter out irrelevant entered segments", () => {
    const context = new ContextMock({ private_settings: {
        "triggers": [
          {
            "serviceAction": {
              "webhook": "https://hooks.zapier.com/hooks/standard/5687326/account-entered-segment/1"
            },
            "inputData": {
              "entered_account_segments": [
                "account_segment_1",
                "account_segment_2",
              ]
            }
          }
        ]
      }});
    const message = {
      "changes": { "account_segments": { "entered": [{ "id": "account_segment_1", "name": "1" }, { "id": "account_segment_2", "name": "2" }, { "id": "account_segment_4", "name": "4" }] }
      },
      "account": {
        "id": "1"
      },
      "events": [],
      "account_segments": [],
      "segments": [],
      "message_id": "message_1"
    };
    const triggers = getEntityTriggers(message, context.connector.private_settings.triggers);
    const { serviceAction, cleanedEntity } = triggers[0];

    expect(_.size(triggers)).toEqual(1);
    expect(_.keys(triggers[0])).toEqual(["serviceAction", "cleanedEntity", "rawEntity"]);
    expect(cleanedEntity).toEqual({
      "changes": { "account_segments": { "entered": [{ "id": "account_segment_1", "name": "1" }, { "id": "account_segment_2", "name": "2" }] } },
      "account": { "id": "1" },
      "account_segments": [],
      "message_id": "message_1"
    });
    expect(serviceAction.webhook).toEqual("https://hooks.zapier.com/hooks/standard/5687326/account-entered-segment/1");
  });

  it("Account Did Not Enter a Segment. Should filter out trigger.", () => {
    const context = new ContextMock({ private_settings: {
        "triggers": [
          {
            "serviceAction": {
              "webhook": "https://hooks.zapier.com/hooks/standard/5687326/account-entered-segment/1"
            },
            "inputData": {
              "entered_account_segments": [
                "account_segment_1"
              ]
            }
          }
        ]
      }});
    const message = {
      "changes": {},
      "account": {
        "id": "1"
      },
      "events": [],
      "account_segments": [],
      "segments": [],
      "message_id": "message_1"
    };
    const triggers = getEntityTriggers(message, context.connector.private_settings.triggers);

    expect(_.size(triggers)).toEqual(0);
  });

});

describe("Outgoing Account Left Segment Filtering Tests", () => {

  it("Account Left Valid Segment. Should not filter out left segment trigger.", () => {
    const context = new ContextMock({ private_settings: {
        "triggers": [
          {
            "serviceAction": {
              "webhook": "https://hooks.zapier.com/hooks/standard/5687326/account-left-segment/1"
            },
            "inputData": {
              "left_account_segments": [
                "account_segment_1",
                "account_segment_2"
              ]
            }
          }
        ]
      }});
    const message = {
      "changes": {
        "account_segments": {
          "left": [{ "id": "account_segment_1" }],
          "entered": [{ "id": "account_segment_2" }]
        }
      },
      "account": {
        "id": "1"
      },
      "events": [],
      "account_segments": [],
      "segments": [],
      "message_id": "message_1"
    };
    const triggers = getEntityTriggers(message, context.connector.private_settings.triggers);
    const { serviceAction, cleanedEntity } = triggers[0];

    expect(_.size(triggers)).toEqual(1);
    expect(_.keys(triggers[0])).toEqual(["serviceAction", "cleanedEntity", "rawEntity"]);
    expect(cleanedEntity).toEqual({
      "changes": { "account_segments": { "left": [{ "id": "account_segment_1" }] } },
      "account": { "id": "1" },
      "account_segments": [],
      "message_id": "message_1"
    });
    expect(serviceAction.webhook).toEqual("https://hooks.zapier.com/hooks/standard/5687326/account-left-segment/1");
  });

  it("Account Left 'all_segments'. Should not filter out trigger.", () => {
    const context = new ContextMock({ private_settings: {
        "triggers": [
          {
            "serviceAction": {
              "webhook": "https://hooks.zapier.com/hooks/standard/5687326/account-left-segment/1"
            },
            "inputData": {
              "left_account_segments": [
                "all_segments"
              ]
            }
          }
        ]
      }});
    const message = {
      "changes": { "account_segments": { "left": [{ "id": "account_segment_1" }, { "id": "account_segment_2" }] }
      },
      "account": {
        "id": "1"
      },
      "events": [],
      "account_segments": [],
      "segments": [],
      "message_id": "message_1"
    };
    const triggers = getEntityTriggers(message, context.connector.private_settings.triggers);
    const { serviceAction, cleanedEntity } = triggers[0];

    expect(_.size(triggers)).toEqual(1);
    expect(_.keys(triggers[0])).toEqual(["serviceAction", "cleanedEntity", "rawEntity"]);
    expect(cleanedEntity).toEqual({
      "changes": { "account_segments": { "left": [{ "id": "account_segment_1" }, { "id": "account_segment_2" }] } },
      "account": { "id": "1" },
      "account_segments": [],
      "message_id": "message_1"
    });
    expect(serviceAction.webhook).toEqual("https://hooks.zapier.com/hooks/standard/5687326/account-left-segment/1");
  });

  it("Account Did Not Leave 'all_segments'. Should filter out trigger.", () => {
    const context = new ContextMock({ private_settings: {
        "triggers": [
          {
            "serviceAction": {
              "webhook": "https://hooks.zapier.com/hooks/standard/5687326/account-left-segment/1"
            },
            "inputData": {
              "left_account_segments": [
                "all_segments"
              ]
            }
          }
        ]
      }});
    const message = {
      "changes": { "account_segments": { "left": [] }
      },
      "account": {
        "id": "1"
      },
      "events": [],
      "account_segments": [],
      "segments": [],
      "message_id": "message_1"
    };
    const triggers = getEntityTriggers(message, context.connector.private_settings.triggers);

    expect(_.size(triggers)).toEqual(0);
  });

  it("Account Left Segment. Should not filter out trigger and should filter out irrelevant left segments", () => {
    const context = new ContextMock({ private_settings: {
        "triggers": [
          {
            "serviceAction": {
              "webhook": "https://hooks.zapier.com/hooks/standard/5687326/account-left-segment/1"
            },
            "inputData": {
              "left_account_segments": [
                "account_segment_1",
                "account_segment_2",
              ]
            }
          }
        ]
      }});
    const message = {
      "changes": { "account_segments": { "left": [{ "id": "account_segment_1", "name": "1" }, { "id": "account_segment_2", "name": "2" }, { "id": "account_segment_4", "name": "4" }] }
      },
      "account": { "id": "1" },
      "account_segments": [],
      "message_id": "message_1"
    };
    const triggers = getEntityTriggers(message, context.connector.private_settings.triggers);
    const { serviceAction, cleanedEntity } = triggers[0];

    expect(_.size(triggers)).toEqual(1);
    expect(_.keys(triggers[0])).toEqual(["serviceAction", "cleanedEntity", "rawEntity"]);
    expect(cleanedEntity).toEqual({
      "changes": { "account_segments": { "left": [{ "id": "account_segment_1", "name": "1" }, { "id": "account_segment_2", "name": "2" }] } },
      "account": { "id": "1" },
      "account_segments": [],
      "message_id": "message_1"
    });
    expect(serviceAction.webhook).toEqual("https://hooks.zapier.com/hooks/standard/5687326/account-left-segment/1");
  });

  it("Account Did Not Leave a Segment. Should filter out trigger.", () => {
    const context = new ContextMock({ private_settings: {
        "triggers": [
          {
            "serviceAction": {
              "webhook": "https://hooks.zapier.com/hooks/standard/5687326/account-left-segment/1"
            },
            "inputData": {
              "left_account_segments": [
                "account_segment_1"
              ]
            }
          }
        ]
      }});
    const message = {
      "changes": {},
      "account": {
        "id": "1"
      },
      "events": [],
      "account_segments": [],
      "message_id": "message_1"
    };
    const triggers = getEntityTriggers(message, context.connector.private_settings.triggers);

    expect(_.size(triggers)).toEqual(0);
  });
});

describe("Outgoing Account Attribute Filtering Tests", () => {

  it("Account Attribute Changed. Should not filter out trigger.", () => {
    const context = new ContextMock({ private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-attribute-updated/1"
            },
            inputData: {
              account_attribute_updated: [ "attr1", "attr2" ],
              account_segments: [ "account_segment_1" ]
            }
          }
        ]
      }});
    const message = {
      "changes": {
        "account": {
          "attr1": ["value_1", "value_2"],
          "bl_attr": ["", "1"]
        },
        "user": {
          "attr1": ["value_1", "value_2"],
          "bl_attr": ["", "1"]
        }
      },
      "account": {
        "id": "1",
        "attr1": "value_2"
      },
      "user": {},
      "segments": [],
      "account_segments": [{ "id": "account_segment_1" }],
      "message_id": "message_1"
    };
    const triggers = getEntityTriggers(message, context.connector.private_settings.triggers);
    const { serviceAction, cleanedEntity } = triggers[0];

    expect(_.size(triggers)).toEqual(1);
    expect(_.keys(triggers[0])).toEqual(["serviceAction", "cleanedEntity", "rawEntity"]);
    expect(cleanedEntity).toEqual({
      "changes": { "account": { "attr1": ["value_1", "value_2"]} },
      "account": { "id": "1", "attr1": "value_2" },
      "account_segments": [{ "id": "account_segment_1" }],
      "message_id": "message_1"
    });
    expect(serviceAction.webhook).toEqual("https://hooks.zapier.com/hooks/standard/5687326/account-attribute-updated/1");
  });

  it("Non Whitelisted Account Attribute Changed. Should filter out trigger.", () => {
    const context = new ContextMock({ private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-attribute-updated/1"
            },
            inputData: {
              account_attribute_updated: [ "attr1", "attr2" ],
              account_segments: [ "account_segment_1" ]
            }
          }
        ]
      }});
    const message = {
      "changes": {
        "account": {
          "bl_attr0": ["value_1", "value_2"],
          "bl_attr1": ["", "1"]
        }
      },
      "account": {
        "id": "1",
        "attr1": "value_2"
      },
      "account_segments": [],
      "segments": [{ "id": "account_segment_1" }],
      "message_id": "message_1"
    };
    const triggers = getEntityTriggers(message, context.connector.private_settings.triggers);
    expect(_.size(triggers)).toEqual(0);
  });

  it("Account attribute changed but account is not in account whitelisted segment. Should filter out trigger.", () => {
    const context = new ContextMock({ private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-attribute-updated/1"
            },
            inputData: {
              account_attribute_updated: [ "attr1", "attr2" ],
              account_segments: [ "account_segment_1" ]
            }
          }
        ]
      }});
    const message = {
      "changes": {
        "account": {
          "attr1": ["value_1", "value_2"],
          "bl_attr": ["", "1"]
        }
      },
      "account": {
        "id": "1",
        "attr1": "value_2"
      },
      "account_segments": [],
      "segments": [{ "id": "account_segment_2" }],
      "message_id": "message_1"
    };
    const triggers = getEntityTriggers(message, context.connector.private_settings.triggers);

    expect(_.size(triggers)).toEqual(0);
  });

  it("Account attribute changed but account is not in account whitelisted segment. Should filter out trigger.", () => {
    const context = new ContextMock({ private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-attribute-updated/1"
            },
            inputData: {
              account_attribute_updated: [ "attr1", "attr2" ],
              account_segments: [ "account_segment_1" ]
            }
          }
        ]
      }});
    const message = {
      "changes": {
        "account": {
          "attr1": ["value_1", "value_2"],
          "bl_attr": ["", "1"]
        }
      },
      "account": {
        "id": "1",
        "attr1": "value_2"
      },
      "account_segments": [{ "id": "account_segment_2" }],
      "segments": [{ "id": "account_segment_1" }],
      "message_id": "message_1"
    };
    const triggers = getEntityTriggers(message, context.connector.private_settings.triggers);

    expect(_.size(triggers)).toEqual(0);
  });

  it("Multiple account attributes changed. Should not filter out trigger.", () => {
    const context = new ContextMock({ private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-attribute-updated/1"
            },
            inputData: {
              account_attribute_updated: [ "attr1", "attr2" ],
              account_segments: [ "all_segments" ]
            }
          }
        ]
      }});
    const message = {
      "changes": {
        "account": {
          "attr1": ["value_1", "value_2"],
          "attr2": ["value_3", "value_4"],
          "bl_attr": ["", "1"]
        }
      },
      "account": {
        "id": "1",
        "attr1": "value_2"
      },
      "account_segments": [{ "id": "account_segment_1" }],
      "segments": [{ "id": "account_segment_1" }],
      "message_id": "message_1"
    };
    const triggers = getEntityTriggers(message, context.connector.private_settings.triggers);
    const { serviceAction, cleanedEntity } = triggers[0];

    expect(_.size(triggers)).toEqual(1);
    expect(_.keys(triggers[0])).toEqual(["serviceAction", "cleanedEntity", "rawEntity"]);
    expect(cleanedEntity).toEqual({
      "changes": { "account": { "attr1": ["value_1", "value_2"], "attr2": ["value_3", "value_4"]} },
      "account": { "id": "1", "attr1": "value_2" },
      "account_segments": [{ "id": "account_segment_1" }],
      "message_id": "message_1"
    });
    expect(serviceAction.webhook).toEqual("https://hooks.zapier.com/hooks/standard/5687326/account-attribute-updated/1");
  });
});

describe("Outgoing Account Created Filtering Tests", () => {

  it("Account created. Should not filter out trigger.", () => {
    const context = new ContextMock({ private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-created/1"
            },
            inputData: {
              is_new_account: true,
              account_segments: [ "account_segment_1" ]
            }
          }
        ]
      }});
    const message = {
      "changes": {
        "is_new": true,
        "account": {
          "attr1": ["value_1", "value_2"],
          "bl_attr": ["", "1"]
        }
      },
      "account": {
        "id": "1",
        "attr1": "value_2"
      },
      "segments": [],
      "account_segments": [{ "id": "account_segment_1" }],
      "message_id": "message_1"
    };
    const triggers = getEntityTriggers(message, context.connector.private_settings.triggers);
    const { serviceAction, cleanedEntity } = triggers[0];

    expect(_.size(triggers)).toEqual(1);
    expect(_.keys(triggers[0])).toEqual(["serviceAction", "cleanedEntity", "rawEntity"]);
    expect(cleanedEntity).toEqual({
      "changes": { "is_new": true },
      "account": { "id": "1", "attr1": "value_2" },
      "account_segments": [{ "id": "account_segment_1" }],
      "message_id": "message_1"
    });
    expect(serviceAction.webhook).toEqual("https://hooks.zapier.com/hooks/standard/5687326/account-created/1");
  });

  it("Account newly created, but does not match whitelisted segment. Should filter out trigger.", () => {
    const context = new ContextMock({ private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-created/1"
            },
            inputData: {
              is_new_account: true,
              account_segments: [ "account_segment_1" ]
            }
          }
        ]
      }});
    const message = {
      "changes": {
        "is_new": true,
        "account": {
          "attr1": ["value_1", "value_2"],
          "bl_attr": ["", "1"]
        }
      },
      "account": {
        "id": "1",
        "attr1": "value_2"
      },
      "account_segments": [],
      "segments": [{ "id": "account_segment_2" }],
      "message_id": "message_1"
    };
    const triggers = getEntityTriggers(message, context.connector.private_settings.triggers);

    expect(_.size(triggers)).toEqual(0);
  });

  it("Account not newly created. Should filter out trigger.", () => {
    const context = new ContextMock({ private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook: "https://hooks.zapier.com/hooks/standard/5687326/account-created/1"
            },
            inputData: {
              is_new_account: false,
              account_segments: [ "account_segment_1" ]
            }
          }
        ]
      }});
    const message = {
      "changes": {
        "is_new": true,
        "account": {
          "attr1": ["value_1", "value_2"],
          "bl_attr": ["", "1"]
        }
      },
      "account": {
        "id": "1",
        "attr1": "value_2"
      },
      "account_segments": [],
      "segments": [{ "id": "account_segment_1" }],
      "message_id": "message_1"
    };
    const triggers = getEntityTriggers(message, context.connector.private_settings.triggers);

    expect(_.size(triggers)).toEqual(0);
  });
});
/*
*/
