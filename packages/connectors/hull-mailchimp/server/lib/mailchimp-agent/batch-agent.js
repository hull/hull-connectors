const Promise = require("bluebird");
const _ = require("lodash");
const ps = require("promise-streams");
const BatchStream = require("batch-stream");
const es = require("event-stream");
const moment = require("moment");

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
   * creates new batch with provided operations and then creates a job
   * to handle the results
   * @api
   */
  create(options) {
    _.defaults(options, {
      chunkSize: process.env.MAILCHIMP_BATCH_HANDLER_SIZE || 100,
      additionalData: {},
      extractField: null
    });

    const { operations, jobs = [] } = options;

    if (_.isEmpty(operations)) {
      return Promise.resolve([]);
    }
    this.metric.increment("batch_job.count", 1);
    return this.mailchimpClient
      .post("/batches")
      .send({ operations })
      .then(response => {
        const { id } = response.body;
        this.client.logger.info("incoming.job.start", {
          id,
          jobName: "mailchimp-batch-job",
          type: "user"
        });
        // if jobs argument is empty, we don't perform next tasks on
        // returned data, so we don't need to queue a handler here
        if (_.isEmpty(jobs)) {
          return Promise.resolve();
        }
        options.batchId = id;
        return this.ctx.enqueue("handleMailchimpBatch", options, {
          delay: process.env.MAILCHIMP_BATCH_HANDLER_INTERVAL || 10000
        });
      })
      .catch(err => {
        const filteredError = this.mailchimpClient.handleError(err);
        this.client.logger.info("incoming.job.error", {
          jobName: "mailchimp-batch-job",
          errors: filteredError.message
        });
        return Promise.reject(filteredError);
      });
  }

  /**
   * checks if the batch is finished
   * @api
   */
  handle(options) {
    const {
      batchId,
      attempt = 1,
      jobs = [],
      chunkSize,
      extractField,
      additionalData
    } = options;
    return this.mailchimpClient
      .get("/batches/{{batchId}}")
      .tmplVar({ batchId })
      .then(response => {
        const batchInfo = response.body;
        this.client.logger.info("incoming.job.progress", {
          jobName: "mailchimp-batch-job",
          progress: _.omit(batchInfo, "_links")
        });
        if (batchInfo.status !== "finished") {
          if (attempt < 6000) {
            options.attempt += 1;
            return this.ctx.enqueue("handleMailchimpBatch", options, {
              delay: process.env.MAILCHIMP_BATCH_HANDLER_INTERVAL || 10000
            });
          }
          this.metric.increment("batch_job.hanged", 1);
          this.client.logger.info("incoming.job.error", {
            jobName: "mailchimp-batch-job",
            data: _.omit(batchInfo, "_links"),
            errors: "batch_job_hanged"
          });
          return this.mailchimpClient
            .delete("/batches/{{batchId}}")
            .tmplVar({ batchId });
        }

        this.metric.increment("batch_job.attempts", attempt);
        this.metric.value(
          "batch_job.completion_time",
          moment(batchInfo.completed_at).diff(batchInfo.submitted_at, "seconds")
        );

        if (
          batchInfo.total_operations === 0 ||
          _.isEmpty(batchInfo.response_body_url)
        ) {
          return Promise.resolve([]);
        }

        /**
         * data is {"status_code":200,"operation_id":"id","response":"encoded_json"}
         */
        return this.mailchimpClient
          .handleResponse(batchInfo)
          .pipe(
            es.through(function write(data) {
              let responseObj = {};
              try {
                responseObj = JSON.parse(data.response);
              } catch (e) {} // eslint-disable-line no-empty
              if (_.get(responseObj, extractField)) {
                return _.get(responseObj, extractField, []).map(r => {
                  return this.emit("data", r);
                });
              }
              return this.emit("data", responseObj);
            })
          )
          .pipe(new BatchStream({ size: chunkSize }))
          .pipe(
            ps.map(ops => {
              try {
                return Promise.all(
                  _.map(jobs, job => {
                    this.client.logger.debug("JOB", {
                      job,
                      length: ops.length
                    });
                    return this.ctx.enqueue(job, {
                      response: ops,
                      additionalData
                    });
                  })
                );
              } catch (e) {
                this.client.logger.debug({ errors: e });
                return Promise.reject(e);
              }
            })
          )
          .wait()
          .then(() =>
            this.mailchimpClient
              .delete("/batches/{{batchId}}")
              .tmplVar({ batchId })
          )
          .then(() =>
            this.client.logger.info("incoming.job.success", {
              jobName: "mailchimp-batch-job"
            })
          );
      });
  }
}

module.exports = MailchimpBatchAgent;
