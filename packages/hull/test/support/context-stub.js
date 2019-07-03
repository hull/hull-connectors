const { expect, should } = require("chai");
const HullStub = require("./hull-stub");

module.exports = function buildContextBaseStub({
  exception = "defaultError", done
} = {}) {
  return {
    HullClient: HullStub,
    metric: {
      captureException: error => {
        expect(error.message).to.equal(exception);
        done()
      },
      mergeContext: () => {},
      increment: () => {}
    },
    clientCredentials: {
      id: "5c21c7a6b0c4ae18e1001123",
      secret: "1234",
      organization: "test.hull.local"
    },
    connectorConfig: {
      hostSecret: "123"
    },
    cache: {
      wrap: () => {}
    }
  };
}
🥺
