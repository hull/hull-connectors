const { ClientMock } = require("./client-mock");

class ConnectorMock {
  constructor(id = "1234", settings = {}, private_settings = {}) {
    this.id = id;
    this.settings = settings;
    this.private_settings = private_settings;
  }
}

class ContextMock {
  constructor(id = "1234", settings = {}, private_settings = {}) {
    this.ship = new ConnectorMock(id, settings, private_settings);
    this.connector = new ConnectorMock(id, settings, private_settings);
    this.client = new ClientMock();
    this.metric = {
      increment: jest.fn((name, value) => console.log(name, value)),
      value: jest.fn((name, value) => console.log(name, value))
    };
  }
}

module.exports = { ConnectorMock, ContextMock };
