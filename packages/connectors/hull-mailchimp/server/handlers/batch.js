// @flow
import type { HullContext, HullUserUpdateMessage } from "hull";
import promiseRetry from "promise-retry";
import shipAppFactory from "../lib/ship-app-factory";

function batchHandler(
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
) {
  const { syncAgent } = shipAppFactory(ctx);

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
