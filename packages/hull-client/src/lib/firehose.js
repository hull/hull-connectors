const _ = require("lodash");
const Configuration = require("./configuration");

const debug = require("debug")("hull:firehose");

const BATCHERS = {};

global.setImmediate = global.setImmediate || process.nextTick.bind(process);

class FirehoseBatcher {
  static async exit() {
    FirehoseBatcher.exiting = true;
    return Promise.all(_.map(BATCHERS, async b => b.flush()));
  }

  static getInstance(config, handler) {
    const { id, secret, organization, accessToken } = config;
    const key = [organization, id, secret].join("/");
    BATCHERS[key] = BATCHERS[key] || new FirehoseBatcher(config, handler);
    const batcher = BATCHERS[key];
    return (message, fn) => {
      message.headers = message.headers || {};
      if (accessToken) {
        message.headers["Hull-Access-Token"] = accessToken;
      }
      return batcher.push(message, fn);
    };
  }

  constructor(config, handler) {
    this.handler = handler;
    this.flushAt = Math.max(config.flushAt || 50, 1);
    this.flushAfter = config.flushAfter || 1000;
    this.config = new Configuration(
      _.omit(config, "userId", "accessToken", "sudo")
    );
    this.queue = [];
  }

  push(payload) {
    return new Promise((resolve, reject) => {
      const message = { ...payload, timestamp: new Date() };
      const callback = (err, res) => {
        return err ? reject(err) : resolve(res);
      };
      debug("Firehose Message Queued", message);
      this.queue.push({ message, callback });

      if (FirehoseBatcher.exiting === true) return this.flush();

      if (this.queue.length >= this.flushAt) this.flush();
      if (this.timer) clearTimeout(this.timer);
      if (this.flushAfter)
        this.timer = setTimeout(this.flush.bind(this), this.flushAfter);
      return true;
    });
  }

  async flush() {
    if (!this.queue.length) return null;
    const items = this.queue.splice(0, this.flushAt);
    const fns = items.map(i => i.callback);
    const batch = items.map(i => i.message);

    const params = {
      batch,
      timestamp: new Date(),
      sentAt: new Date()
    };
    try {
      const flushed = await this.handler(params, this);
      fns.forEach(func => func(null, flushed));
      return { flushed, queue: this.queue.length };
    } catch (err) {
      fns.forEach(func =>
        func({ status: err.status, message: err.message }, null)
      );
      return Promise.reject(err);
    }
  }
}

module.exports = FirehoseBatcher;
