// @flow
import type { HullContext } from "hull";

const Promise = require("bluebird");
const _ = require("lodash");
const moment = require("moment");
const ps = require("promise-streams");
const BatchStream = require("batch-stream");
const es = require("event-stream");
const shipAppFactory = require("../../lib/ship-app-factory");

const CHUNK_SIZE = 200;

export default async function executeBatchJob(
  ctx: HullContext,
  { jobName, batchId, importType }
): Promise<*> {
  if (_.isNil(batchId)) {
    ctx.client.logger.info("incoming.job.success", {
      message: "No active batch to import",
      jobName: "mailchimp-batch-job",
      type: importType
    });
    return {
      status: 200,
      data: {
        message: "No active batch to import"
      }
    };
  }

  ctx.client.logger.info("incoming.job.start", {
    message: `import ${importType} batch`,
    batchId,
    jobName: "mailchimp-batch-job",
    type: importType
  });

  const { syncAgent, mailchimpClient } = shipAppFactory(ctx);
  let batchData;
  try {
    batchData = await mailchimpClient.getBatchJob(batchId);
  } catch (error) {
    ctx.client.logger.info("incoming.job.error", {
      batchId,
      jobName: "mailchimp-batch-job",
      type: importType,
      message: "Fetching Batch Job Failed"
    });
    return {
      status: 500,
      data: {
        message: "Fetching Batch Job Failed"
      }
    };
  }
  const status = batchData.status;
  if (status === 404) {
    ctx.client.logger.info("incoming.job.error", {
      batchId,
      jobName: "mailchimp-batch-job",
      type: importType,
      message: "Batch Job Not Found"
    });
    await ctx.cache.del(`${importType}_batch_id`);
    await ctx.cache.del(`${importType}_batch_lock`);
    return {
      status: 404,
      data: {
        message: "Batch Not Found"
      }
    };
  }

  if (status !== "finished") {
    ctx.client.logger.info("incoming.job.progress", {
      batchId,
      jobName: "mailchimp-batch-job",
      type: importType,
      message: "Batch Job Still Processing in Mailchimp"
    });
    return {
      status: 200,
      data: {
        message: "Batch Job Still Processing. Try Again Later."
      }
    };
  }

  const response_body_url = batchData.response_body_url;

  return mailchimpClient
    .handleResponse({ response_body_url })
    .pipe(
      es.through(async function write(data) {
        let responseObj = {};
        try {
          responseObj = JSON.parse(data.response);
        } catch (e) {} // eslint-disable-line no-empty

        if (_.get(responseObj, `${importType}s`)) {
          return _.get(responseObj, `${importType}s`, []).map(r => {
            return this.emit("data", r);
          });
        }
        return false;
      })
    )
    .pipe(new BatchStream({ size: CHUNK_SIZE }))
    .pipe(
      ps.map(ops => {
        try {
          return ctx.enqueue(jobName, {
            response: ops
          });
        } catch (e) {
          ctx.client.logger.debug({ errors: e });
          return Promise.reject(e);
        }
      })
    )
    .wait()
    .then(async () => {
      ctx.client.logger.info("incoming.job.success", {
        batchId,
        jobName: "mailchimp-batch-job",
        type: importType
      });
      if (importType === "email") {
        ctx.helpers.settingsUpdate({
          last_track_at: moment.utc().format()
        });
      }

      await ctx.cache.del(`${importType}_batch_id`);
      await ctx.cache.del(`${importType}_batch_lock`);

      return mailchimpClient.deleteBatchJob(batchId).catch(error => {
        return syncAgent.client.logger.info("incoming.job.warning", {
          batchId,
          jobName: "mailchimp-batch-job",
          type: importType,
          message: `Unable to delete batch job: ${error.message}`
        });
      });
    });
}
