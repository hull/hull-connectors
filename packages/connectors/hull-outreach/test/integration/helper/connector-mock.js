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
    this.client.utils = {
      settings: { update: jest.fn(() => Promise.resolve(this.connector)) }
    };
    this.metric = {
      increment: jest.fn((name, value) => console.log(name, value)),
      value: jest.fn((name, value) => console.log(name, value))
    };
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
        return Promise.resolve(this.connector);
      })
    };
    this.helpers = {
      updateSettings: () => {
        return Promise.resolve(this.connector);
      }
    }
  }
}

module.exports = { ConnectorMock, ContextMock };