const _ = require("lodash");
const Configuration = require("./configuration");

const BATCHERS = {};

global.setImmediate = global.setImmediate || process.nextTick.bind(process);

class FirehoseBatcher {

  static exit() {
    FirehoseBatcher.exiting = true;
    const cb = k => (err, ok) => {
      const msg = `Flushed batcher ${k} -- ok=${ok} -- err=${err}`;
      return msg;
    }
    const flushed = _.map(BATCHERS, (b, k) => {
      b.flush(cb(k));
    });
    return Promise.all(flushed);
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
    this.flushAt = Math.max(config.flushAt, 1) || 50;
    this.flushAfter = config.flushAfter || 10000;
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

      this.queue.push({ message, callback });

      if (FirehoseBatcher.exiting === true) return this.flush();

      if (this.queue.length >= this.flushAt) this.flush();
      if (this.timer) clearTimeout(this.timer);
      if (this.flushAfter)
        this.timer = setTimeout(this.flush.bind(this), this.flushAfter);
      return true;
    });
  }

  flush(fn) {
    fn = fn || (() => {});
    if (!this.queue.length) return Promise.resolve(fn);

    const items = this.queue.splice(0, this.flushAt);
    const fns = items.map(i => i.callback);
    const batch = items.map(i => i.message);

    const params = {
      batch,
      timestamp: new Date(),
      sentAt: new Date()
    };


    const flushed = this.handler(params, this);
    flushed.then(
      ok => fns.forEach(func => func(null, ok)),
      err => fns.forEach(func => func(err, null))
    );
    return flushed.then(fn, fn);
  }
}

module.exports = FirehoseBatcher;
