/* global describe, it */
const sinon = require("sinon");
const Promise = require("bluebird");

const ClientMock = require("./support/client-mock");

const batchHandler = require("../../server/notif-handlers/batch");


describe("handleBatchExtractJob", function EventsAgentTest() {
  it("should run extract data from json file", () => {
    const syncAgent = {
      sendUserUpdateMessages: () => Promise.resolve()
    };
    const syncAgentMock = sinon.mock(syncAgent);
    syncAgentMock
      .expects("sendUserUpdateMessages")
      .once()
      .returns(Promise.resolve());

    const ctx = {
      shipApp: {
        syncAgent,
        mailchimpAgent: {
          ensureWebhookSubscription: () => Promise.resolve()
        }
      },
      enqueue: () => { return Promise.resolve(); },
      client: ClientMock()
    };

    return batchHandler(
        ctx,
        [{ user: { segment_ids: [] }, segments: [] }]
      )
      .then(() => {
        syncAgentMock.verify();
      });
  });
});
