const { expect } = require("chai");

const hasMatchingSegments = require("../../../src/helpers/has-matching-segments");

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
  it("Should match a whitelist", () => {
    const ctx = buildCtx({});
    const response = hasMatchingSegments(ctx)({
      matchOnBatch: true,
      whitelist: ["1"],
      blacklist: [],
      entity: "user",
      message
    });
    expect(response).to.be.ok;
  });
  it("Should match a blacklist", () => {
    const ctx = buildCtx({});
    const response = hasMatchingSegments(ctx)({
      matchOnBatch: true,
      whitelist: [],
      blacklist: ["1"],
      entity: "user",
      message
    });
    expect(response).to.not.be.ok;
  });
  it("Should match a whitelist and blacklist with blacklist preference", () => {
    const ctx = buildCtx({});
    const response = hasMatchingSegments(ctx)({
      matchOnBatch: true,
      whitelist: ["2"],
      blacklist: ["1"],
      entity: "user",
      message
    });
    expect(response).to.not.be.ok;
  });
  it("Should match a ALL", () => {
    const ctx = buildCtx({});
    const response = hasMatchingSegments(ctx)({
      matchOnBatch: true,
      whitelist: ["ALL"],
      blacklist: [],
      entity: "user",
      message
    });
    expect(response).to.be.ok;
  });
  it("Should match a ALL but respect blacklist", () => {
    const ctx = buildCtx({});
    const response = hasMatchingSegments(ctx)({
      matchOnBatch: true,
      whitelist: ["ALL"],
      blacklist: ["1"],
      entity: "user",
      message
    });
    expect(response).to.not.be.ok;
  });
  it("Should always send on Batch", () => {
    const ctx = buildCtx({});
    const response = hasMatchingSegments({ ...ctx, isBatch: true })({
      matchOnBatch: true,
      whitelist: [],
      blacklist: ["1"],
      entity: "user",
      message
    });
    expect(response).to.be.ok;
  });
});
