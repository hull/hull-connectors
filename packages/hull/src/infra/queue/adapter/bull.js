const Queue = require("bull");

/**
 * Bull Adapter for queue
 */
class BullAdapter {
  constructor(options) {
    this.options = options;
    this.queue = new Queue("main", options);
    this.queue.on("error", err => {
      console.error("queue.adapter.error", err);
    });
    this.queue.on("cleaned", (job, type) => {
      console.log("queue.adapter.clean", { count: job.length, type });
    });
  }

  inactiveCount() {
    return this.queue.getJobCounts().then(counts => counts.wait);
  }

  failedCount() {
    return this.queue.getJobCounts().then(counts => counts.failed);
  }

  /**
   * @param {string} jobName queue name
   * @param {Object} jobPayload
   * @return {Promise}
   */
  async create(
    ctx,
    jobName,
    jobPayload = {},
    { ttl = 0, delay = null, priority = null, backoff, attempts = 3 } = {}
  ) {
    return this.queue.add(jobName, jobPayload, {
      priority,
      delay,
      timeout: ttl,
      backoff,
      attempts,
      removeOnComplete: true
    });
  }

  /**
   * @param {string} jobName
   * @param {Function} jobCallback
   * @return {Object} this
   */
  process(name, callback) {
    this.queue.process(name, async (job, done) => {
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
    return this.queue.close();
  }

  setupUiRouter(router) {
    // eslint-disable-line class-methods-use-this
    // due to problems in arena configuration it's disabled right now
    // and removed from the package.json
    //
    // const arenaConfig = {
    //   queues: [{
    //     name: "main",
    //     port: this.queue.client.options.port,
    //     host: this.queue.client.options.host,
    //     hostId: "main",
    //     db: this.queue.client.options.db,
    //     password: this.queue.client.options.password,
    //     prefix: this.options.prefix
    //   }]
    // };
    // router.use('/', arena(arenaConfig));
    return router;
  }

  clean() {
    // failed in more than 15 days
    this.queue.clean(1296000000, "failed");
  }
}

module.exports = BullAdapter;
