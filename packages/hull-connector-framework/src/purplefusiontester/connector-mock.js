const { ClientMock } = require("./client-mock");

class ConnectorMock {
  constructor(id = "1234", private_settings = {}) {
    this.id = id;
    this.private_settings = private_settings;
  }
}

class ContextMock {
  constructor(configuration) {
    const { id, hostname, private_settings } = configuration;
    this.hostname = hostname;
    this.ship = new ConnectorMock(id, private_settings);
    this.connector = new ConnectorMock(id, private_settings);
    this.client = new ClientMock(configuration);
    this.metric = {
      increment: jest.fn((name, value) => console.log(name, value)),
      value: jest.fn((name, value) => console.log(name, value))
    };
    this.notification = {};
    this.cache = {
      wrap: jest.fn((key, cb) => {
        return Promise.resolve(cb());
      }),
      get: jest.fn(() => {
        return Promise.resolve();
      }),
      set: jest.fn(() => {
        return Promise.resolve();
      }),
      del: jest.fn(() => {
        return Promise.resolve();
      })
    };
  }
}

module.exports = { ConnectorMock, ContextMock };
