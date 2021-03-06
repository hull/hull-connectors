/* @flow */
import type { HullContext, HullJob } from "hull";
import { asyncComputeAndIngest, varsFromSettings } from "hull-vm";
import getResultsUrl from "../lib/get-results-url";

/**
 * SyncIn : import all the list members as hull users
 */
export default function handler(_EntryModel: {}) {
  return async function fetchAllUsers(
    ctx: HullContext,
    payload: any = {},
    job: HullJob
  ) {
    const { agent, org } = payload;
    const { helpers, connector } = ctx;
    const { private_settings = {} } = connector;
    const { code } = private_settings;
    const { streamRequest } = helpers;

    let progress = 0;

    return new Promise((resolve, reject) =>
      streamRequest({
        url: getResultsUrl(ctx, agent, org),
        format: "csv",
        batchSize: 50,
        onError: error => reject(error),
        onEnd: () =>
          resolve({
            status: "ok",
            data: {
              message: "Job Completed",
              total: progress
            }
          }),
        onData: async data => {
          progress += data.length;
          if (job.progress) {
            job.progress(progress);
          }
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
      })
    );
  };
}
