const promiseRetry = require("promise-retry");

function batchHandler(ctx, messages) {
  const { syncAgent } = ctx.shipApp;

  return promiseRetry(
    retry => {
      return syncAgent
        .sendUserUpdateMessages(messages, {
          useSegments: true,
          ignoreFilter: true
        })
        .catch(retry);
    },
    { retries: 2, minTimeout: 0 }
  );
}

module.exports = batchHandler;
