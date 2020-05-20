/* @flow */
import type { HullContext } from "hull";
import { asyncComputeAndIngest, varsFromSettings } from "hull-vm";
import resultsUrl from "../lib/get-results-url";

/**
 * SyncIn : import all the list members as hull users
 */
export default function handler(EntryModel: Object) {
  return function fetchAllUsers(ctx: HullContext, options: any = {}) {
    console.log("FETCHALL", options);
    const { agent } = options;
    const { helpers, connector } = ctx;
    const { private_settings = {} } = connector;
    const { code } = private_settings;
    const { streamRequest } = helpers;

    const url = resultsUrl(ctx, agent);

    ctx.client.logger.info("incoming.job.start", {
      options,
      url
    });

    let lines = 0;
    let ingestionErrors = [];

    streamRequest({
      url,
      format: "csv",
      batchSize: 10,
      onError: error => {
        ingestionErrors.push(error);
        ctx.client.logger.info("incoming.job.error", { error });
      },
      onEnd: () => {},
      onData: data => {
        return asyncComputeAndIngest(ctx, {
          source: "phantombuster",
          EntryModel,
          payload: {
            method: "GET",
            url: agent.name,
            agent,
            data,
            variables: varsFromSettings(ctx)
          },
          code,
          preview: true
        })
      }
    });
  };
}
