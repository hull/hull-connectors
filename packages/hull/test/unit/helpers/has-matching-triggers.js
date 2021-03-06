const { expect } = require("chai");

const hasMatchingTriggers = require("../../../src/helpers/has-matching-triggers");

function buildCtx(settings) {
  return {
    // helpers: {
    //   operations: operations()
    // },
    connectorConfig: {
      manifest: {
        private_settings: {
          name: "synchronized_segments_whitelist",
          title: "Emit only when in one of these segments",
          type: "array",
          default: [],
          format: "segment",
          options: {}
        }
      }
    },
    connector: {
      private_settings: settings
    }
  };
}

describe("has matching segments computation", () => {
  const message = {
    user: {},
    account: {},
    changes: {},
    account_segments: [{ id: "1" }, { id: "2" }],
    user_segments: [{ id: "1" }, { id: "2" }]
  };
  const ctx = buildCtx({});

  it("Should not match if no trigger", () => {
    const response = hasMatchingTriggers(ctx)({
      message,
      triggers: {}
    });
    expect(response).to.not.be.ok;
  });
  it("Should trigger on user_events", () => {
    const response = hasMatchingTriggers(ctx)({
      message: {
        ...message,
        events: [{ event: "FooBar" }]
      },
      triggers: { user_events: ["FooBar"] }
    });
    expect(response).to.be.ok;
  });
  it("Should trigger on user_segments", () => {
    const response = hasMatchingTriggers(ctx)({
      message: {
        ...message,
        segments: [{ id: "123" }]
      },
      triggers: { user_segments_whitelist: ["123"] }
    });
    expect(response).to.be.ok;
  });
  it("Should trigger on account_segments", () => {
    const response = hasMatchingTriggers(ctx)({
      message: {
        ...message,
        account_segments: [{ id: "123" }]
      },
      triggers: { account_segments_whitelist: ["123"] }
    });
    expect(response).to.be.ok;
  });
  it("Should NOT trigger on account_segments_blacklist", () => {
    const response = hasMatchingTriggers(ctx)({
      message: {
        ...message,
        account_segments: [{ id: "123" }]
      },
      triggers: { account_segments_blacklist: ["123"] }
    });
    expect(response).to.not.be.ok;
  });
  it("Should NOT trigger on user_segments_blacklist", () => {
    const response = hasMatchingTriggers(ctx)({
      message: {
        ...message,
        segments: [{ id: "123" }]
      },
      triggers: { user_segments_blacklist: ["123"] }
    });
    expect(response).to.not.be.ok;
  });
  it("Should NOT trigger on user_segments_blacklist + ALL (with mode 'all')", () => {
    const response = hasMatchingTriggers(ctx)({
      mode: "all",
      message: {
        ...message,
        segments: [{ id: "123" }]
      },
      triggers: {
        user_segments_whitelist: ["ALL"],
        user_segments_blacklist: ["123"]
      }
    });
    expect(response).to.not.be.ok;
  });
  it("Should NOT trigger if only one matches(with mode 'all')", () => {
    const response = hasMatchingTriggers(ctx)({
      mode: "all",
      message: {
        ...message,
        changes: { user: { foo: [0, 1] } },
        segments: [{ id: "123" }]
      },
      triggers: {
        user_attribute_updated: ["foo"],
        user_segments_blacklist: ["123"]
      }
    });
    expect(response).to.not.be.ok;
  });
  it("Should trigger on user_segments_entered", () => {
    const response = hasMatchingTriggers(ctx)({
      message: {
        ...message,
        changes: { segments: { entered: [{ id: "123" }] } }
      },
      triggers: { user_segments_entered: ["123"] }
    });
    expect(response).to.be.ok;
  });
  it("Should trigger on user_segments_left", () => {
    const response = hasMatchingTriggers(ctx)({
      message: {
        ...message,
        changes: { segments: { left: [{ id: "123" }] } }
      },
      triggers: { user_segments_left: ["123"] }
    });
    expect(response).to.be.ok;
  });
  it("Should trigger on is_new_user", () => {
    const response = hasMatchingTriggers(ctx)({
      message: {
        ...message,
        user: {
          id: "1"
        },
        changes: { is_new: true }
      },
      triggers: { is_new_user: true }
    });
    expect(response).to.be.ok;
  });
  it("Should trigger on user_attribute_updated", () => {
    const response = hasMatchingTriggers(ctx)({
      message: {
        ...message,
        changes: { user: { traits_foo: [0, 1] } }
      },
      triggers: { user_attribute_updated: ["traits_foo"] }
    });
    expect(response).to.be.ok;
  });
  it("Should trigger on account_attribute_updated", () => {
    const response = hasMatchingTriggers(ctx)({
      message: {
        ...message,
        changes: { account: { foo: [0, 1] } }
      },
      triggers: { account_attribute_updated: ["foo"] }
    });
    expect(response).to.be.ok;
  });
  it("Should trigger on account_segments_entered", () => {
    const response = hasMatchingTriggers(ctx)({
      message: {
        ...message,
        changes: { account_segments: { entered: [{ id: "456" }] } }
      },
      triggers: { account_segments_entered: ["456"] }
    });
    expect(response).to.be.ok;
  });
  it("Should trigger on account_segments_left", () => {
    const response = hasMatchingTriggers(ctx)({
      message: {
        ...message,
        changes: { account_segments: { left: [{ id: "456" }] } }
      },
      triggers: { account_segments_left: ["456"] }
    });
    expect(response).to.be.ok;
  });
  it("Should trigger on multiple triggers", () => {
    const response = hasMatchingTriggers(ctx)({
      message: {
        ...message,
        changes: {
          segments: { entered: [{ id: "123" }] },
          account_segments: { left: [{ id: "456" }] }
        }
      },
      triggers: {
        user_segments_entered: ["123"],
        account_segments_left: ["456"]
      }
    });
    expect(response).to.be.ok;
  });
});
