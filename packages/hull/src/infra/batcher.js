const _ = require("lodash");
const Promise = require("bluebird");
const debug = require("debug")("hull-connector:batcher");

const HANDLERS = {};

class Batcher {
  static exit() {
    debug("batcher.exit");
    if (!Batcher.exiting) {
      const exiting = Promise.all(_.map(HANDLERS, h => h.flush()));
      Batcher.exiting = exiting;
      return exiting;
    }
    return Promise.resolve([]);
  }

  static getHandler(ns, args) {
    const name = ns + args.ctx.connector.id;
    return (HANDLERS[name] = HANDLERS[name] || new Batcher(ns, args)); // eslint-disable-line no-return-assign
  }

  constructor(ns, { ctx, options = {} }) {
    this.ns = ns;
    this.logger = ctx.client.logger;
    this.messages = [];
    this.options = options;

    this.flushLater = _.throttle(this.flush.bind(this), this.options.maxTime);
    return this;
  }

  setCallback(callback) {
    this.callback = callback;
    return this;
  }

  addMessage(message) {
    this.messages.push(message);
    const { maxSize } = this.options;
    if (this.messages.length >= maxSize) {
      return this.flush();
    }
    return this.flushLater();
  }

  flush() {
    const messages = this.messages;
    this.messages = [];
    return this.callback(messages);
  }
}

module.exports = Batcher;
