// const { LoggerMock } = require("./loggermetrics-mock");

const Promise = require("bluebird");

class ClientMock {
  constructor() {
    this.configuration = {};
    this.logger = {
      info: (msg, data) => console.log(msg, data),
      debug: (msg, data) => console.log(msg, data),
      error: (msg, data) => console.log(msg, data),
      warn: (msg, data) => console.log(msg, data),
      log: (msg, data) => console.log(msg, data)
    };
    this.get = () => Promise.resolve();
    this.post = () => Promise.resolve();
    this.put = () => Promise.resolve();
    this.traits = () => Promise.resolve();
    this.track = () => Promise.resolve();
    this.asUser = () => this;
    this.asAccount = () => this;
    this.account = () => this;
  }
}

module.exports = { ClientMock };
