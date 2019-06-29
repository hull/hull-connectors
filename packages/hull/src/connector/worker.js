// @flow
const Supply = require("supply");
const Promise = require("bluebird");
const _ = require("lodash");
const debug = require("debug")("hull-connector:worker");

/**
 * Background worker using QueueAdapter.
 */
class Worker {
  queueAdapter: Object;

  instrumentation: Object;

  res: Object;

  supply: Supply;

  jobs: Object;

  constructor({ queue, instrumentation, jobs }: Object) {
    if (!queue) {
      throw new Error(
        "Worker initialized without all required dependencies: queue"
      );
    }
    this.queueAdapter = queue.adapter;
    this.instrumentation = instrumentation;

    this.supply = new Supply();

    this.setJobs(jobs);

    // this.use(queue.contextMiddleware());
    // this.use(cache.contextMiddleware());

    // this.use(instrumentation.contextMiddleware());
    // instrument jobs between 1 and 5 minutes
    setInterval(this.metricJobs.bind(this), _.random(60000, 300000));

    setInterval(
      this.queueAdapter.clean.bind(this.queueAdapter),
      _.random(60000, 300000)
    );
  }

  metricJobs = () =>
    Promise.all([
      this.queueAdapter.inactiveCount(),
      this.queueAdapter.failedCount()
    ]).spread((inactiveCount, failedCount) => {
      this.instrumentation.metricVal("ship.queue.waiting", inactiveCount);
      this.instrumentation.metricVal("ship.queue.failed", failedCount);
    });

  use = (middleware: Function) => {
    this.supply.use(middleware);
    return this;
  };

  setJobs(jobs: Object) {
    this.jobs = jobs;
  }

  process(queueName?: string = "queueApp") {
    this.queueAdapter.process(queueName, this.dispatch);
    return this;
  }

  dispatch = async (job: Object) => {
    if (_.isEmpty(job.data)) {
      return undefined;
    }
    const { data, id } = job;
    const { name } = data;
    const req = {
      headers: {},
      // @TODO: This keeps compatibility with bodyParser which looks for a Headers hash
      ..._.cloneDeep(data.context)
    };
    const payload = _.cloneDeep(data.payload);
    const res = {};
    const startTime = process.hrtime();
    return Promise.fromCallback(callback => {
      this.instrumentation.startTransaction(name, async () => {
        try {
          await this.runMiddleware(req, res);
          const { client, metric } = req.hull;
          if (!this.jobs[name]) {
            const err = new Error(`Job not found: ${name}`);
            client.logger.error(err.message);
            throw err;
          }
          client.logger.debug("dispatch", { id, name });
          metric.increment(`ship.job.${name}.start`);
          const jobResponse = this.jobs[name].call(job, req.hull, payload);
          callback(null, jobResponse);
        } catch (err) {
          debug("Worker Error", err, err.stack);
          req.hull.metric.increment(`ship.job.${name}.error`);
          this.instrumentation.captureException(
            err,
            {
              job_id: id,
              job_payload: payload
            },
            {
              job_name: name,
              organization: _.get(data.context, "query.organization"),
              ship: _.get(data.context, "query.ship")
            }
          );
          callback(err);
        }
        this.instrumentation.endTransaction();
        const duration = process.hrtime(startTime);
        const ms = duration[0] * 1000 + duration[1] / 1000000;
        req.hull.metric.value(`ship.job.${name}.duration`, ms);
      });
    });
  };

  runMiddleware = (req: Object, res: Object) =>
    Promise.fromCallback(callback => {
      this.supply.each(req, res, callback);
    });
}

module.exports = Worker;
