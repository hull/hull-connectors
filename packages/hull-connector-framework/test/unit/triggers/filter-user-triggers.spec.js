/* @flow */
const _ = require("lodash");

const {
  getEntityTriggers
} = require("../../../src/purplefusion/triggers/trigger-utils");
const {
  ContextMock
} = require("../../../src/purplefusiontester/connector-mock");

describe("Outgoing User Segment Whitelist and Blacklist Tests", () => {
  it("User is in Whitelist. Should Trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [{ inputData: { user_segments: ["user_segment_1"] } }]
      }
    });
    const message = {
      account: {},
      user: {
        id: "1"
      },
      events: [],
      account_segments: [],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    expect(_.size(triggers)).toEqual(1);
  });
  it("User is not in Whitelist. Should not Trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [{ inputData: { user_segments: ["user_segment_1"] } }]
      }
    });
    const message = {
      account: {},
      user: {
        id: "1"
      },
      events: [],
      account_segments: [],
      segments: [{ id: "user_segment_2" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    expect(_.size(triggers)).toEqual(0);
  });
  it("No Whitelist. Should not Trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          { inputData: { user_segments_blacklist: ["user_segment_1"] } }
        ]
      }
    });
    const message = {
      account: {},
      user: {
        id: "1"
      },
      events: [],
      account_segments: [],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    expect(_.size(triggers)).toEqual(0);
  });
  it("User is in Blacklist. Should not Trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            inputData: {
              user_segments: ["user_segment_1"],
              user_segments_blacklist: ["user_segment_1"]
            }
          }
        ]
      }
    });
    const message = {
      account: {},
      user: {
        id: "1"
      },
      events: [],
      account_segments: [],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    expect(_.size(triggers)).toEqual(0);
  });
  it("ALL in Whitelist. Should Trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            inputData: {
              user_segments: ["ALL"]
            }
          }
        ]
      }
    });
    const message = {
      account: {},
      user: {
        id: "1"
      },
      events: [],
      account_segments: [],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    expect(_.size(triggers)).toEqual(1);
  });
  it("ALL in Whitelist+ In Blacklist. Should NOT Trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            inputData: {
              user_segments: ["ALL"],
              user_segments_blacklist: ["user_segment_1"]
            }
          }
        ]
      }
    });
    const message = {
      account: {},
      user: {
        id: "1"
      },
      events: [],
      account_segments: [],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    expect(_.size(triggers)).toEqual(0);
  });
});

describe("Outgoing User Entered Segment Filtering Tests", () => {
  it("User Entered Valid Segment. Should not filter out entered segment trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-entered-segment/1"
            },
            inputData: {
              user_segments_entered: ["user_segment_1", "user_segment_2"]
            }
          }
        ]
      }
    });
    const message = {
      changes: {
        segments: {
          entered: [{ id: "user_segment_1" }, { id: "user_segment_3" }]
        }
      },
      account: {},
      user: {
        id: "1"
      },
      events: [],
      account_segments: [],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    const { serviceAction, cleanedEntity } = triggers[0];

    expect(_.size(triggers)).toEqual(1);
    expect(_.keys(triggers[0])).toEqual([
      "serviceAction",
      "cleanedEntity",
      "rawEntity"
    ]);
    expect(cleanedEntity).toEqual({
      changes: { segments: { entered: [{ id: "user_segment_1" }] } },
      account: {},
      user: { id: "1" },
      account_segments: [],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    });
    expect(serviceAction.webhook).toEqual(
      "https://hooks.zapier.com/hooks/standard/5687326/user-entered-segment/1"
    );
  });

  it("User Linked To Account. Should Trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [{ inputData: { user_account_linked: ["id"] } }]
      }
    });
    const message = {
      account: {},
      user: {
        id: "1"
      },
      changes: {
        account: {
          id: [null, "1"]
        }
      },
      events: [],
      account_segments: [],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    expect(_.size(triggers)).toEqual(1);
  });

  it("User Not Linked To Account. Should Not Trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [{ inputData: { user_account_linked: ["id"] } }]
      }
    });
    const message = {
      account: {},
      user: {
        id: "1"
      },
      changes: {
        account: {
          name: [null, "rei"]
        }
      },
      events: [],
      account_segments: [],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    expect(_.size(triggers)).toEqual(0);
  });

  it("Lead Linked To Account. Should Trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [{ inputData: { lead_account_linked: ["id"] } }]
      }
    });
    const message = {
      account: {},
      user: {
        id: "1"
      },
      changes: {
        account: {
          id: [null, "1"]
        }
      },
      events: [],
      account_segments: [],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    expect(_.size(triggers)).toEqual(1);
  });

  it("Lead Not Linked To Account. Should Not Trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [{ inputData: { lead_account_linked: ["id"] } }]
      }
    });
    const message = {
      account: {},
      user: {
        id: "1"
      },
      changes: {
        account: {
          name: [null, "rei"]
        }
      },
      events: [],
      account_segments: [],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    expect(_.size(triggers)).toEqual(0);
  });

  it("User Entered 'all_segments'. Should not filter out trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-entered-segment/1"
            },
            inputData: {
              user_segments_entered: ["all_segments"]
            }
          }
        ]
      }
    });
    const message = {
      changes: {
        segments: {
          entered: [{ id: "user_segment_1" }, { id: "user_segment_2" }],
          left: [{ id: "user_segment_3" }, { id: "user_segment_4" }]
        }
      },
      account: {},
      user: {
        id: "1"
      },
      events: [],
      account_segments: [],
      segments: [{ id: "user_segment_1" }, { id: "user_segment_2" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    const { serviceAction, cleanedEntity } = triggers[0];

    expect(_.size(triggers)).toEqual(1);
    expect(_.keys(triggers[0])).toEqual([
      "serviceAction",
      "cleanedEntity",
      "rawEntity"
    ]);
    expect(cleanedEntity).toEqual({
      changes: {
        segments: {
          entered: [{ id: "user_segment_1" }, { id: "user_segment_2" }]
        }
      },
      account: {},
      user: { id: "1" },
      account_segments: [],
      segments: [{ id: "user_segment_1" }, { id: "user_segment_2" }],
      message_id: "message_1"
    });
    expect(serviceAction.webhook).toEqual(
      "https://hooks.zapier.com/hooks/standard/5687326/user-entered-segment/1"
    );
  });

  it("User Did Not Enter 'all_segments'. Should filter out trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-entered-segment/1"
            },
            inputData: {
              user_segments_entered: ["all_segments"]
            }
          }
        ]
      }
    });
    const message = {
      changes: { segments: { entered: [] } },
      account: {},
      user: {
        id: "1"
      },
      events: [],
      account_segments: [],
      segments: [],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );

    expect(_.size(triggers)).toEqual(0);
  });

  it("User Entered Segment. Should not filter out trigger and should filter out irrelevant entered segments", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-entered-segment/1"
            },
            inputData: {
              user_segments_entered: ["user_segment_1", "user_segment_2"]
            }
          }
        ]
      }
    });
    const message = {
      changes: {
        segments: {
          entered: [
            { id: "user_segment_1", name: "1" },
            { id: "user_segment_2", name: "2" },
            { id: "user_segment_4", name: "4" }
          ]
        }
      },
      account: {},
      user: {
        id: "1"
      },
      events: [],
      account_segments: [],
      segments: [
        { id: "user_segment_1", name: "1" },
        { id: "user_segment_2", name: "2" },
        { id: "user_segment_4", name: "4" }
      ],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    const { serviceAction, cleanedEntity } = triggers[0];

    expect(_.size(triggers)).toEqual(1);
    expect(_.keys(triggers[0])).toEqual([
      "serviceAction",
      "cleanedEntity",
      "rawEntity"
    ]);
    expect(cleanedEntity).toEqual({
      changes: {
        segments: {
          entered: [
            { id: "user_segment_1", name: "1" },
            { id: "user_segment_2", name: "2" }
          ]
        }
      },
      account: {},
      user: { id: "1" },
      account_segments: [],
      segments: [
        { id: "user_segment_1", name: "1" },
        { id: "user_segment_2", name: "2" },
        { id: "user_segment_4", name: "4" }
      ],
      message_id: "message_1"
    });
    expect(serviceAction.webhook).toEqual(
      "https://hooks.zapier.com/hooks/standard/5687326/user-entered-segment/1"
    );
  });

  it("User Did Not Enter a Segment. Should filter out trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-entered-segment/1"
            },
            inputData: {
              user_segments_entered: ["user_segment_1"]
            }
          }
        ]
      }
    });
    const message = {
      changes: {},
      account: {},
      user: {
        id: "1"
      },
      events: [],
      account_segments: [],
      segments: [],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );

    expect(_.size(triggers)).toEqual(0);
  });
});

describe("Outgoing User Left Segment Filtering Tests", () => {
  it("User Left Valid Segment. Should not filter out left segment trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-left-segment/1"
            },
            inputData: {
              user_segments_left: ["user_segment_1", "user_segment_2"]
            }
          }
        ]
      }
    });
    const message = {
      changes: {
        segments: {
          left: [{ id: "user_segment_1" }],
          entered: [{ id: "user_segment_2" }]
        }
      },
      account: {},
      user: {
        id: "1"
      },
      events: [],
      account_segments: [],
      segments: [{ id: "user_segment_2" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    const { serviceAction, cleanedEntity } = triggers[0];

    expect(_.size(triggers)).toEqual(1);
    expect(_.keys(triggers[0])).toEqual([
      "serviceAction",
      "cleanedEntity",
      "rawEntity"
    ]);
    expect(cleanedEntity).toEqual({
      changes: { segments: { left: [{ id: "user_segment_1" }] } },
      account: {},
      user: { id: "1" },
      account_segments: [],
      segments: [{ id: "user_segment_2" }],
      message_id: "message_1"
    });
    expect(serviceAction.webhook).toEqual(
      "https://hooks.zapier.com/hooks/standard/5687326/user-left-segment/1"
    );
  });

  it("User Left 'all_segments'. Should not filter out trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-left-segment/1"
            },
            inputData: {
              user_segments_left: ["all_segments"]
            }
          }
        ]
      }
    });
    const message = {
      changes: {
        segments: { left: [{ id: "user_segment_1" }, { id: "user_segment_2" }] }
      },
      account: {},
      user: {
        id: "1"
      },
      events: [],
      account_segments: [],
      segments: [{ id: "user_segment_3" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    const { serviceAction, cleanedEntity } = triggers[0];

    expect(_.size(triggers)).toEqual(1);
    expect(_.keys(triggers[0])).toEqual([
      "serviceAction",
      "cleanedEntity",
      "rawEntity"
    ]);
    expect(cleanedEntity).toEqual({
      changes: {
        segments: { left: [{ id: "user_segment_1" }, { id: "user_segment_2" }] }
      },
      account: {},
      user: { id: "1" },
      account_segments: [],
      segments: [{ id: "user_segment_3" }],
      message_id: "message_1"
    });
    expect(serviceAction.webhook).toEqual(
      "https://hooks.zapier.com/hooks/standard/5687326/user-left-segment/1"
    );
  });

  it("User Did Not Leave 'all_segments'. Should filter out trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-left-segment/1"
            },
            inputData: {
              user_segments_left: ["all_segments"]
            }
          }
        ]
      }
    });
    const message = {
      changes: { segments: { left: [] } },
      account: {},
      user: {
        id: "1"
      },
      events: [],
      account_segments: [],
      segments: [],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );

    expect(_.size(triggers)).toEqual(0);
  });

  it("User Left Segment. Should not filter out trigger and should filter out irrelevant left segments", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-left-segment/1"
            },
            inputData: {
              user_segments_left: ["user_segment_1", "user_segment_2"]
            }
          }
        ]
      }
    });
    const message = {
      changes: {
        segments: {
          left: [
            { id: "user_segment_1", name: "1" },
            { id: "user_segment_2", name: "2" },
            { id: "user_segment_4", name: "4" }
          ]
        }
      },
      account: {},
      user: {
        id: "1"
      },
      events: [],
      account_segments: [],
      segments: [],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    const { serviceAction, cleanedEntity } = triggers[0];

    expect(_.size(triggers)).toEqual(1);
    expect(_.keys(triggers[0])).toEqual([
      "serviceAction",
      "cleanedEntity",
      "rawEntity"
    ]);
    expect(cleanedEntity).toEqual({
      changes: {
        segments: {
          left: [
            { id: "user_segment_1", name: "1" },
            { id: "user_segment_2", name: "2" }
          ]
        }
      },
      account: {},
      user: { id: "1" },
      account_segments: [],
      segments: [],
      message_id: "message_1"
    });
    expect(serviceAction.webhook).toEqual(
      "https://hooks.zapier.com/hooks/standard/5687326/user-left-segment/1"
    );
  });

  it("User Did Not Leave a Segment. Should filter out trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-left-segment/1"
            },
            inputData: {
              user_segments_left: ["user_segment_1"]
            }
          }
        ]
      }
    });
    const message = {
      changes: {},
      account: {},
      user: {
        id: "1"
      },
      events: [],
      account_segments: [],
      segments: [],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );

    expect(_.size(triggers)).toEqual(0);
  });
});

describe("Outgoing User Attribute Filtering Tests", () => {
  it("User Attribute Changed. Should not filter out trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-attribute-updated/1"
            },
            inputData: {
              user_attribute_updated: ["attr1", "attr2"],
              user_segments: ["user_segment_1"],
              account_segments: ["all_segments"]
            }
          }
        ]
      }
    });
    const message = {
      changes: {
        user: {
          attr1: ["value_1", "value_2"],
          bl_attr: ["", "1"]
        },
        account: {
          attr1: ["value_1", "value_2"],
          bl_attr: ["", "1"]
        }
      },
      account: {},
      user: {
        id: "1",
        attr1: "value_2"
      },
      account_segments: [],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    const { serviceAction, cleanedEntity } = triggers[0];

    expect(_.size(triggers)).toEqual(1);
    expect(_.keys(triggers[0])).toEqual([
      "serviceAction",
      "cleanedEntity",
      "rawEntity"
    ]);
    expect(cleanedEntity).toEqual({
      changes: { user: { attr1: ["value_1", "value_2"] } },
      account: {},
      user: { id: "1", attr1: "value_2" },
      account_segments: [],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    });
    expect(serviceAction.webhook).toEqual(
      "https://hooks.zapier.com/hooks/standard/5687326/user-attribute-updated/1"
    );
  });

  it("User Array Attribute Changed. Should not filter out trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-attribute-updated/1"
            },
            inputData: {
              user_attribute_updated: ["attr1", "attr2"],
              user_segments: ["user_segment_1"],
              account_segments: ["all_segments"]
            }
          }
        ]
      }
    });
    const message = {
      changes: {
        user: {
          "attr1[0]": ["value_1", "value_2"],
          bl_attr: ["", "1"]
        },
        account: {
          attr1: ["value_1", "value_2"],
          bl_attr: ["", "1"]
        }
      },
      account: {},
      user: {
        id: "1",
        attr1: ["value_2"]
      },
      account_segments: [],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    const { serviceAction, cleanedEntity } = triggers[0];

    expect(_.size(triggers)).toEqual(1);
    expect(_.keys(triggers[0])).toEqual([
      "serviceAction",
      "cleanedEntity",
      "rawEntity"
    ]);
    expect(cleanedEntity).toEqual({
      changes: { user: { "attr1[0]": ["value_1", "value_2"] } },
      account: {},
      user: { id: "1", attr1: ["value_2"] },
      account_segments: [],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    });
    expect(serviceAction.webhook).toEqual(
      "https://hooks.zapier.com/hooks/standard/5687326/user-attribute-updated/1"
    );
  });

  it("Non Whitelisted User Attribute Changed. Should filter out trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-attribute-updated/1"
            },
            inputData: {
              user_attribute_updated: ["attr1", "attr2"],
              user_segments: ["user_segment_1"],
              account_segments: ["all_segments"]
            }
          }
        ]
      }
    });
    const message = {
      changes: {
        user: {
          bl_attr0: ["value_1", "value_2"],
          bl_attr1: ["", "1"]
        }
      },
      account: {},
      user: {
        id: "1",
        attr1: "value_2"
      },
      account_segments: [],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    expect(_.size(triggers)).toEqual(0);
  });

  it("User attribute changed but user is not in user whitelisted segment. Should filter out trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-attribute-updated/1"
            },
            inputData: {
              user_attribute_updated: ["attr1", "attr2"],
              user_segments: ["user_segment_1"],
              account_segments: ["all_segments"]
            }
          }
        ]
      }
    });
    const message = {
      changes: {
        user: {
          attr1: ["value_1", "value_2"],
          bl_attr: ["", "1"]
        }
      },
      account: {},
      user: {
        id: "1",
        attr1: "value_2"
      },
      account_segments: [],
      segments: [{ id: "user_segment_2" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );

    expect(_.size(triggers)).toEqual(0);
  });

  it("User attribute changed but user is not in account whitelisted segment. Should filter out trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-attribute-updated/1"
            },
            inputData: {
              user_attribute_updated: ["attr1", "attr2"],
              user_segments: ["user_segment_1"],
              account_segments: ["account_segment_1"]
            }
          }
        ]
      }
    });
    const message = {
      changes: {
        user: {
          attr1: ["value_1", "value_2"],
          bl_attr: ["", "1"]
        }
      },
      account: {},
      user: {
        id: "1",
        attr1: "value_2"
      },
      account_segments: [{ id: "account_segment_2" }],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );

    expect(_.size(triggers)).toEqual(0);
  });

  it("Multiple user attributes changed. Should not filter out trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-attribute-updated/1"
            },
            inputData: {
              user_attribute_updated: ["attr1", "attr2"],
              user_segments: ["all_segments"],
              account_segments: ["all_segments"]
            }
          }
        ]
      }
    });
    const message = {
      changes: {
        user: {
          attr1: ["value_1", "value_2"],
          attr2: ["value_3", "value_4"],
          bl_attr: ["", "1"]
        }
      },
      account: {},
      user: {
        id: "1",
        attr1: "value_2"
      },
      account_segments: [{ id: "account_segment_1" }],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    const { serviceAction, cleanedEntity } = triggers[0];

    expect(_.size(triggers)).toEqual(1);
    expect(_.keys(triggers[0])).toEqual([
      "serviceAction",
      "cleanedEntity",
      "rawEntity"
    ]);
    expect(cleanedEntity).toEqual({
      changes: {
        user: { attr1: ["value_1", "value_2"], attr2: ["value_3", "value_4"] }
      },
      account: {},
      user: { id: "1", attr1: "value_2" },
      account_segments: [{ id: "account_segment_1" }],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    });
    expect(serviceAction.webhook).toEqual(
      "https://hooks.zapier.com/hooks/standard/5687326/user-attribute-updated/1"
    );
  });
});

describe("Outgoing User Event Created Filtering Tests", () => {
  it("User event created. Should not filter out trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-event-created/1"
            },
            inputData: {
              account_segments: ["all_segments"],
              user_segments: ["user_segment_1"],
              user_events: ["Email Opened"]
            }
          }
        ]
      }
    });
    const message = {
      user: { id: "1" },
      changes: {},
      account: {},
      events: [{ event: "Email Opened", id: "event_1" }],
      segments: [{ id: "user_segment_1" }],
      account_segments: [],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    const { serviceAction, cleanedEntity } = triggers[0];

    expect(_.size(triggers)).toEqual(1);
    expect(_.keys(triggers[0])).toEqual([
      "serviceAction",
      "cleanedEntity",
      "rawEntity"
    ]);
    expect(cleanedEntity).toEqual({
      user: { id: "1" },
      account: {},
      events: [{ event: "Email Opened", id: "event_1" }],
      segments: [{ id: "user_segment_1" }],
      account_segments: [],
      message_id: "message_1"
    });
    expect(serviceAction.webhook).toEqual(
      "https://hooks.zapier.com/hooks/standard/5687326/user-event-created/1"
    );
  });

  it("User event created. Should not filter out trigger and should filter out irrelevant events", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-event-created/1"
            },
            inputData: {
              account_segments: ["all_segments"],
              user_segments: ["user_segment_1"],
              user_events: ["Email Opened", "Email Sent"]
            }
          }
        ]
      }
    });
    const message = {
      user: { id: "1" },
      changes: {},
      account: {},
      events: [
        { event: "Email Opened" },
        { event: "Email Sent" },
        { event: "Email Dropped" }
      ],
      segments: [{ id: "user_segment_1" }],
      account_segments: [],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    const { serviceAction, cleanedEntity } = triggers[0];

    expect(_.size(triggers)).toEqual(1);
    expect(_.keys(triggers[0])).toEqual([
      "serviceAction",
      "cleanedEntity",
      "rawEntity"
    ]);
    expect(cleanedEntity).toEqual({
      user: { id: "1" },
      account: {},
      events: [{ event: "Email Opened" }, { event: "Email Sent" }],
      segments: [{ id: "user_segment_1" }],
      account_segments: [],
      message_id: "message_1"
    });
    expect(serviceAction.webhook).toEqual(
      "https://hooks.zapier.com/hooks/standard/5687326/user-event-created/1"
    );
  });

  it("User event created, but user is not in whitelisted segment. Should filter out trigger and should filter out irrelevant events", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-event-created/1"
            },
            inputData: {
              account_segments: ["all_segments"],
              user_segments: ["user_segment_1"],
              user_events: ["Email Opened", "Email Sent"]
            }
          }
        ]
      }
    });
    const message = {
      user: { id: "1" },
      changes: {},
      account: {},
      events: [
        { event: "Email Opened" },
        { event: "Email Sent" },
        { event: "Email Dropped" }
      ],
      segments: [{ id: "user_segment_2" }],
      account_segments: [],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );

    expect(_.size(triggers)).toEqual(0);
  });

  it("User event created, but user's account is not in whitelisted segment. Should filter out trigger and should filter out irrelevant events", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-event-created/1"
            },
            inputData: {
              account_segments: ["account_segment_1"],
              user_segments: ["user_segment_1"],
              user_events: ["Email Opened", "Email Sent"]
            }
          }
        ]
      }
    });
    const message = {
      user: { id: "1" },
      changes: {},
      account: {},
      events: [
        { event: "Email Opened" },
        { event: "Email Sent" },
        { event: "Email Dropped" }
      ],
      segments: [{ id: "user_segment_1" }],
      account_segments: [{ id: "account_segment_2" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );

    expect(_.size(triggers)).toEqual(0);
  });

  it("No user event created. Should filter out trigger", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-event-created/1"
            },
            inputData: {
              account_segments: ["all_segments"],
              user_segments: ["user_segment_1"],
              user_events: ["Email Opened"]
            }
          }
        ]
      }
    });
    const message = {
      user: { id: "1" },
      changes: {},
      account: {},
      events: [],
      segments: [{ id: "user_segment_1" }],
      account_segments: [],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );

    expect(_.size(triggers)).toEqual(0);
  });

  it("Non whitelisted user event created. Should filter out trigger", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-event-created/1"
            },
            inputData: {
              account_segments: ["all_segments"],
              user_segments: ["user_segment_1"],
              user_events: ["Email Opened"]
            }
          }
        ]
      }
    });
    const message = {
      user: { id: "1" },
      changes: {},
      account: {},
      events: [{ event: "Email Sent" }, { event: "Email Dropped" }],
      segments: [{ id: "user_segment_1" }],
      account_segments: [],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );

    expect(_.size(triggers)).toEqual(0);
  });

  it("'all_events' whitelisted user event created. Should not filter out trigger", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-event-created/1"
            },
            inputData: {
              user_events: ["all_events"]
            }
          }
        ]
      }
    });
    const message = {
      user: { id: "1" },
      changes: {},
      account: {},
      events: [{ event: "Email Sent" }, { event: "Email Dropped" }],
      segments: [{ id: "user_segment_1" }],
      account_segments: [],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );

    expect(_.size(triggers)).toEqual(1);
  });

  it("'all_events' whitelisted but there are no events in message. Should filter out trigger", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-event-created/1"
            },
            inputData: {
              account_segments: ["all_segments"],
              user_segments: ["user_segment_1"],
              user_events: ["all_events"]
            }
          }
        ]
      }
    });
    const message = {
      user: { id: "1" },
      changes: {},
      account: {},
      events: [],
      segments: [{ id: "user_segment_1" }],
      account_segments: [],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );

    expect(_.size(triggers)).toEqual(0);
  });
});

describe("Outgoing User Created Filtering Tests", () => {
  it("User created. Should not filter out trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-created/1"
            },
            inputData: {
              is_new_user: true,
              user_segments: ["user_segment_1"]
            }
          }
        ]
      }
    });
    const message = {
      changes: {
        is_new: true,
        user: {
          attr1: ["value_1", "value_2"],
          bl_attr: ["", "1"]
        }
      },
      account: {},
      user: {
        id: "1",
        attr1: "value_2"
      },
      account_segments: [],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    const { serviceAction, cleanedEntity } = triggers[0];

    expect(_.size(triggers)).toEqual(1);
    expect(_.keys(triggers[0])).toEqual([
      "serviceAction",
      "cleanedEntity",
      "rawEntity"
    ]);
    expect(cleanedEntity).toEqual({
      changes: { is_new: true },
      account: {},
      user: { id: "1", attr1: "value_2" },
      account_segments: [],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    });
    expect(serviceAction.webhook).toEqual(
      "https://hooks.zapier.com/hooks/standard/5687326/user-created/1"
    );
  });

  it("User newly created, but does not match whitelisted segment. Should filter out trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-created/1"
            },
            inputData: {
              is_new_user: true,
              user_segments: ["user_segment_1"]
            }
          }
        ]
      }
    });
    const message = {
      changes: {
        is_new: true,
        user: {
          attr1: ["value_1", "value_2"],
          bl_attr: ["", "1"]
        }
      },
      account: {},
      user: {
        id: "1",
        attr1: "value_2"
      },
      account_segments: [],
      segments: [{ id: "user_segment_2" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );

    expect(_.size(triggers)).toEqual(0);
  });

  it("User not newly created. Should filter out trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-created/1"
            },
            inputData: {
              is_new_user: true,
              user_segments: ["user_segment_1"]
            }
          }
        ]
      }
    });
    const message = {
      changes: {
        is_new: false,
        user: {
          attr1: ["value_1", "value_2"],
          bl_attr: ["", "1"]
        }
      },
      account: {},
      user: {
        id: "1",
        attr1: "value_2"
      },
      account_segments: [],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );

    expect(_.size(triggers)).toEqual(0);
  });
});


describe("Outgoing Account Update On User Update Message Filtering Tests", () => {

  it("Account Entered Valid Segment. Message Is Propagated Down To User. Should filter out trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-entered-segment/1"
            },
            inputData: {
              account_segments_entered: ["account_segment_1", "account_segment_2"]
            }
          }
        ]
      }
    });
    const message = {
      changes: {
        account_segments: {
          entered: [{ id: "account_segment_1" }, { id: "account_segment_3" }]
        }
      },
      account: {
        id: "1"
      },
      user: {
        id: "2"
      },
      events: [],
      account_segments: [{ id: "account_segment_1" }],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    expect(_.size(triggers)).toEqual(0);
  });

  it("Account Left Valid Segment. Message Is Propagated Down To User. Should filter out trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-entered-segment/1"
            },
            inputData: {
              account_segments_left: ["account_segment_1", "account_segment_2"]
            }
          }
        ]
      }
    });
    const message = {
      changes: {
        account_segments: {
          left: [{ id: "account_segment_1" }, { id: "account_segment_3" }]
        }
      },
      account: {
        id: "1"
      },
      user: {
        id: "2"
      },
      events: [],
      account_segments: [{ id: "account_segment_1" }],
      segments: [{ id: "user_segment_1" }],
      message_id: "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    expect(_.size(triggers)).toEqual(0);
  });

  it("Account Is New. Message Is Propagated Down To User. Should filter out trigger.", () => {
    const context = new ContextMock({
      private_settings: {
        triggers: [
          {
            serviceAction: {
              webhook:
                "https://hooks.zapier.com/hooks/standard/5687326/user-entered-segment/1"
            },
            inputData: {
              is_new_account: true,
              account_segments: [ "account_segment_1", "account_segment_3" ]
            }
          }
        ]
      }
    });
    const message = {
      "changes": {
        "is_new": true,
        "account": {
          "id": "5bd329d5e2bcf3eeaf000099"
        },
        "user": {},
        "account_segments": {},
        "segments": {}
      },
      "user": {
        "id": "1"
      },
      "account": {
        "id": "5bd329d5e2bcf3eeaf000099"
      },
      "segments": [],
      "account_segments": [{ "id": "account_segment_1" }],
      "message_id": "message_1"
    };
    const triggers = getEntityTriggers(
      message,
      context.connector.private_settings.triggers
    );
    expect(_.size(triggers)).toEqual(0);
  });
});
