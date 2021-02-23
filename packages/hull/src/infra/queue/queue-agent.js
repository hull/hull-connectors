// @flow

import _ from "lodash";
import type { HullContext, HullQueueConfig } from "../../types";

const debug = require("debug")("hull:queue-agent");
const enqueue = require("./enqueue");
const MemoryAdapter = require("./adapter/memory");
const BullAdapter = require("./adapter/bull");

/**
 * By default it's initiated inside `Hull.Connector` as a very simplistic in-memory queue, but in case of production grade needs, it comes with a [Kue](https://github.com/Automattic/kue) or [Bull](https://github.com/OptimalBits/bull) adapters which you can initiate in a following way:
 *
 * `Options` from the constructor of the `BullAdapter` or `KueAdapter` are passed directly to the internal init method and can be set with following parameters:
 *
 * <https://github.com/Automattic/kue#redis-connection-settings> <https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue>
 *
 * The `queue` instance has a `contextMiddleware` method which adds `req.hull.enqueue` method to queue jobs - this is done automatically by `Hull.Connector().setupApp(app)`:
 *
 * ```javascript
 * req.hull.enqueue((jobName = ''), (jobPayload = {}), (options = {}));
 * ```
 *
 * By default the job will be retried 3 times and the payload would be removed from queue after successfull completion.
 *
 * Then the handlers to work on a specific jobs is defined in following way:
 *
 * ```javascript
 * connector.worker({
 *   jobsName: (ctx, jobPayload) => {
 *     // process Payload
 *     // this === job (kue job object)
 *     // return Promise
 *   }
 * });
 * connector.startWorker();
 * ```
 * @deprecated internal connector queue is considered an antipattern, this class is kept only for backward compatiblity
 * @memberof Infra
 * @public
 * @param {Object} adapter
 * @example
 * ```javascript
 * const { Queue } = require("hull/lib/infra");
 * const BullAdapter = require("hull/lib/infra/queue/adapter/bull");
 *
 * const queueAdapter = new BullAdapter(options);
 * const queue = new Queue(queueAdapter);
 *
 * const connector = new Hull.Connector({ queue });
 * ```
 */

const REDIS_REQUIRED_KEYS = ["name", "url"];
const missingKeys = config => (required: Array<string>) => {
  const missing = _.filter(required, k => config[k] === undefined);
  if (missing.length) {
    throw new Error(`Missing key in queueConfig: ${_.join(missing)}, Can't boot.
    Either define a queue Name in "connectorConfig.queueConfig" or use store: 'memory'`);
  }
};

class QueueAgent {
  adapter: any;

  constructor(config: HullQueueConfig) {
    const { store } = config;
    const missing = missingKeys(config);
    debug("New Queue", { config });
    if (store === "redis") {
      missing(REDIS_REQUIRED_KEYS);
      this.adapter = new BullAdapter(
        _.pick(config, ["name", "url", "settings"])
      );
    } else {
      this.adapter = new MemoryAdapter();
    }
    this.getEnqueue = this.getEnqueue.bind(this);
  }

  getEnqueue = (ctx: HullContext) => enqueue.bind(null, this.adapter, ctx);

  exit() {
    return this.adapter.exit();
  }
}

module.exports = QueueAgent;
