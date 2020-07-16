/* @flow */
import type { HullContext, HullJob } from "hull";
import { asyncComputeAndIngest, varsFromSettings } from "hull-vm";
import getResultsUrl from "../lib/get-results-url";

/**
 * SyncIn : import all the list members as hull users
 */
export default function handler(_EntryModel: Object) {
  return function fetchAllUsers(
    ctx: HullContext,
    options: any = {},
    _job: HullJob
  ) {
    const { agent, org } = options;
    const { helpers, connector } = ctx;
    const { private_settings = {} } = connector;
    const { code } = private_settings;
    const { streamRequest } = helpers;

    streamRequest({
      url: getResultsUrl(ctx, agent, org),
      format: "csv",
      batchSize: 50,
      onError: _error => {},
      onEnd: () => {},
      onData: async data => {
        return asyncComputeAndIngest(ctx, {
          source: "phantombuster",
          payload: {
            method: "GET",
            url: agent.name,
            agent,
            org,
            data,
            variables: varsFromSettings(ctx)
          },
          code,
          preview: false
        });
      }
    });
  };
}
