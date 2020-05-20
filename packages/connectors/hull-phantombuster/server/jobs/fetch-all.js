/* @flow */
import type { HullContext } from "hull";
import { asyncComputeAndIngest, varsFromSettings } from "hull-vm";
import resultsUrl from "../lib/get-results-url";

/**
 * SyncIn : import all the list members as hull users
 */
export default function handler(_EntryModel: Object) {
  return function fetchAllUsers(ctx: HullContext, options: any = {}) {
    const { agent } = options;
    const { helpers, connector } = ctx;
    const { private_settings = {} } = connector;
    const { code } = private_settings;
    const { streamRequest } = helpers;

    streamRequest({
      url: resultsUrl(ctx, agent),
      format: "csv",
      batchSize: 50,
      onError: _error => {},
      onEnd: () => {},
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
    });
  };
}
