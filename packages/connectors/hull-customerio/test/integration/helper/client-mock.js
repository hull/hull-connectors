const Promise = require("bluebird");

class ClientMock {
  constructor() {
    this.configuration = { secret: "topsecret123" };

    const logFunction = (msg, data) => process.env.DEBUG && console.log(msg, data);

    this.logger = {
      info: jest.fn(logFunction),
      debug: jest.fn(logFunction),
      error: jest.fn(logFunction),
      warn: jest.fn(logFunction),
      log: jest.fn(logFunction)
    };
    this.get = jest.fn(() => Promise.resolve());
    this.post = jest.fn(() => Promise.resolve());
    this.put = jest.fn(() => Promise.resolve());
    this.traits = jest.fn(() => Promise.resolve());
    this.track = jest.fn(() => Promise.resolve());
    this.asUser = jest.fn(() => this);
    this.asAccount = jest.fn(() => this);
    this.account = jest.fn(() => this);
  }
}

module.exports = { ClientMock };
