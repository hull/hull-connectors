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
      increment: (name, value) => {},
      value: (name, value) => {}
    };

    this.cache = {
      wrap: (key, cb) => Promise.resolve(cb),
      get: () => Promise.resolve(),
      set: () => Promise.resolve()
    };

    this.helpers = {
      updateSettings: () => Promise.resolve(this.connector)
    };
  }
}

module.exports = { ConnectorMock, ContextMock };
