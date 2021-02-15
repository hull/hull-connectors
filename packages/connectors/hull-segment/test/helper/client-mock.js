import sinon from "sinon";

class ClientMock {
  constructor() {
    this.configuration = { secret: "topsecret123" };

    this.logger = {
      info: (msg, data) => console.log(msg, data),
      debug: (msg, data) => console.log(msg, data),
      error: (msg, data) => console.log(msg, data),
      warn: (msg, data) => console.log(msg, data),
      log: (msg, data) => console.log(msg, data),
    };
    sinon.spy(this.logger, "info");
    sinon.spy(this.logger, "debug");
    sinon.spy(this.logger, "error");
    sinon.spy(this.logger, "warn");
    sinon.spy(this.logger, "log");

    this.get = () => Promise.resolve();
    this.post = () => Promise.resolve();
    this.put = () => Promise.resolve();
    this.traits = () => Promise.resolve();
    this.asUser = () => this;
    this.asAccount = () => this;
    this.account = () => this;
  }
}

module.exports = { ClientMock };
