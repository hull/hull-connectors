const Promise = require("bluebird");
const kue = require("kue");
const ui = require("kue-ui");

/**
 * Kue Adapter for queue
 * @param {Object} options
 */
class KueAdapter {
  constructor(options) {
    this.options = options;
    this.queue = kue.createQueue(options);
    this.queue.watchStuckJobs();
    this.queue.on("error", err => {
      console.error("queue.adapter.error", err);
    });
    this.app = kue.app;

    [
      "inactiveCount",
      "activeCount",
      "completeCount",
      "failedCount",
      "delayedCount"
    ].forEach(name => {
      this[name] = Promise.promisify(this.queue[name]).bind(this.queue);
    });
  }

  /**
   * @param {string} jobName queue name
   * @param {Object} jobPayload
   * @return {Promise}
   */
  create(
    ctx,
    jobName,
    jobPayload = {},
    { ttl = 0, delay = null, priority = null, backoff, attempts = 3 } = {}
  ) {
    // const { client } = ctx;
    // const { logger } = client;
    return Promise.fromCallback(callback => {
      const job = this.queue.create(jobName, jobPayload).removeOnComplete(true);

      if (attempts) {
        job.attempts(attempts);
      }

      if (ttl) {
        job.ttl(ttl);
      }

      if (delay) {
        job.delay(delay);
      }

      if (priority) {
        job.priority(priority);
      }

      if (backoff) {
        job.backoff(backoff);
      }

      // job.on("start", result => logger.info("job.start", { result }));
      // job.on("failed", error => logger.info("job.failed", { error }));
      // job.on("failed attempt", (error, attempt) =>
      //   logger.info("job.failed_attempt", { attempt, error })
      // );
      // job.on("progress", progress => logger.info("job.progress", { progress }));
      // job.on("complete", result => logger.info("job.complete", { result }));

      return job.save(err => {
        callback(err, job.id);
      });
    });
  }

  /**
   * @param {string} jobName
   * @param {Function} jobCallback
   * @return {Object} this
   */
  process(jobName, callback) {
    this.queue.process(jobName, async (job, done) => {
      try {
        const res = await callback(job);
        done(null, res);
      } catch (err) {
        done(err);
      }
    });
    return this;
  }

  exit() {
    return Promise.fromCallback(callback => {
      this.queue.shutdown(5000, callback);
    });
  }

  setupUiRouter(router) {
    ui.setup({
      apiURL: "/kue/_api", // IMPORTANT: specify the api url
      baseURL: "/kue", // IMPORTANT: specify the base url
      updateInterval: 5000 // Optional: Fetches new data every 5000 ms
    });

    router.use("/_api", this.app);
    router.use("/", ui.app);
    return router;
  }

  clean() {} // eslint-disable-line class-methods-use-this
}

module.exports = KueAdapter;
