/* @flow */
import type { HullContext } from "hull";
import { asyncComputeAndIngest, varsFromSettings } from "hull-vm";
import resultsUrl from "../lib/get-results-url";

/**
 * SyncIn : import all the list members as hull users
 */
export default function handler(_EntryModel: Object) {
  return async function fetchAllUsers(ctx: HullContext, options: any = {}) {
    const { agent } = options;
    const { helpers, connector } = ctx;
    const { private_settings = {} } = connector;
    const { code } = private_settings;
    const { streamRequest } = helpers;
    return new Promise((resolve, reject) =>
      streamRequest({
        url: resultsUrl(ctx, agent),
        format: "csv",
        batchSize: 50,
        onError: error => reject(error),
        onEnd: () => resolve(),
        onData: async data =>
          asyncComputeAndIngest(ctx, {
            source: "phantombuster",
            payload: {
              method: "GET",
              url: agent.name,
              agent,
              data,
              variables: varsFromSettings(ctx)
            },
            code,
            preview: false
          })
      })
    );
  };
}
