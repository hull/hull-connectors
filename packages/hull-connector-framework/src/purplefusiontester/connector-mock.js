const { ClientMock } = require("./client-mock");

class ConnectorMock {
  constructor(id = "1234", private_settings = {}, accept_incoming_webhooks) {
    this.id = id;
    this.private_settings = private_settings;
    this.accept_incoming_webhooks = accept_incoming_webhooks;
  }
}

class ContextMock {
  constructor(configuration) {
    const { id, hostname, private_settings, accept_incoming_webhooks = true } = configuration;
    this.hostname = hostname;
    this.ship = new ConnectorMock(id, private_settings);
    this.connector = new ConnectorMock(id, private_settings);
    this.client = new ClientMock(configuration);

    this.helpers = {
      settingsUpdate: this.client.utils.settings.update
    }

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
