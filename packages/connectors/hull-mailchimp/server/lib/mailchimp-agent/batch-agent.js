const Promise = require("bluebird");
const _ = require("lodash");
const ps = require("promise-streams");
const BatchStream = require("batch-stream");
const es = require("event-stream");
const moment = require("moment");

const CHUNK_SIZE = 200;
/**
 * Class responsible for working with Mailchimp batches
 * @see http://developer.mailchimp.com/documentation/mailchimp/reference/batches/
 * TODO: integrate with MailchimpAgent
 */
class MailchimpBatchAgent {
  constructor(ctx, mailchimpClient) {
    this.ctx = ctx;
    this.client = ctx.client;
    this.metric = ctx.metric;
    this.mailchimpClient = mailchimpClient;
  }

  /**
   * creates new batch with provided operations
   * @api
   */
  async create(options) {
    this.metric.increment("batch_job.count", 1);
    const { operations, importType } = options;
    try {
      const batchJob = await this.mailchimpClient.createBatchJob({
        operations
      });
      if (!batchJob) {
        this.client.logger.info("incoming.job.error", {
          jobName: "create-mailchimp-batch-job",
          type: importType,
          message: "Unable to create batch job"
        });
        return Promise.resolve({});
      }

      const { id } = batchJob;
      this.client.logger.info("incoming.job.start", {
        id,
        type: importType,
        jobName: "create-mailchimp-batch-job",
        message: "Batch Creation Initiated In Mailchimp"
      });

      return Promise.resolve(batchJob);
    } catch (error) {
      const filteredError = this.mailchimpClient.handleError(error);
      this.client.logger.info("incoming.job.error", {
        jobName: "create-mailchimp-batch-job",
        errors: filteredError.message
      });
      return Promise.reject(filteredError);
    }
  }

  /**
   * checks if the batch is finished
   * @api
   */
  async handle(options) {
    const { batchId, jobName, importType, additionalData = {} } = options;

    if (_.isNil(batchId)) {
      this.client.logger.info("incoming.job.success", {
        message: "No active batch to import",
        jobName: "mailchimp-batch-job",
        type: importType
      });
      return Promise.resolve({});
    }

    this.client.logger.info("incoming.job.start", {
      message: `import ${importType} batch`,
      batchId,
      jobName: "mailchimp-batch-job",
      type: importType
    });

    let batchData;
    try {
      batchData = await this.mailchimpClient.getBatchJob(batchId);
    } catch (error) {
      this.client.logger.info("incoming.job.error", {
        batchId,
        jobName: "mailchimp-batch-job",
        type: importType,
        message: "Fetching Batch Job Failed"
      });
      return Promise.resolve({});
    }

    const status = batchData.status;
    if (status === 404) {
      this.client.logger.info("incoming.job.error", {
        batchId,
        jobName: "mailchimp-batch-job",
        type: importType,
        message: "Batch Job Not Found"
      });
      await this.ctx.cache.del(`${importType}_batch_id`);
      await this.ctx.cache.del(`${importType}_batch_lock`);
      return Promise.resolve([]);
    }

    if (status !== "finished") {
      this.client.logger.info("incoming.job.progress", {
        batchId,
        jobName: "mailchimp-batch-job",
        type: importType,
        message: "Batch Job Still Processing in Mailchimp"
      });
      await this.ctx.cache.del(`${importType}_batch_lock`);
      return Promise.resolve([]);
    }

    this.metric.value(
      "batch_job.completion_time",
      moment(batchData.completed_at).diff(batchData.submitted_at, "seconds")
    );

    const response_body_url = batchData.response_body_url;

    return this.mailchimpClient
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
            return this.ctx.enqueue(jobName, {
              response: ops,
              additionalData
            });
          } catch (e) {
            this.ctx.client.logger.debug({ errors: e });
            return Promise.reject(e);
          }
        })
      )
      .wait()
      .then(async () => {
        this.ctx.client.logger.info("incoming.job.success", {
          batchId,
          jobName: "mailchimp-batch-job",
          type: importType
        });
        if (importType === "email") {
          this.ctx.helpers.settingsUpdate({
            last_track_at: batchData.submitted_at
          });
        }

        await this.ctx.cache.del(`${importType}_batch_id`);
        await this.ctx.cache.del(`${importType}_batch_lock`);

        return this.delete(batchId);
      });
  }

  delete(batchId, retry = 1) {
    return this.mailchimpClient.deleteBatchJob(batchId).catch(error => {
      if (retry > 0) {
        retry -= 1;
        return this.delete(batchId, retry);
      }
      return this.client.logger.info("incoming.job.warning", {
        batchId,
        jobName: "mailchimp-batch-job",
        message: `Unable to delete batch job: ${error.message}`
      });
    });
  }
}

module.exports = MailchimpBatchAgent;
