const { ClientMock } = require("./client-mock");

class ShipMock {
  constructor(id = "1234", settings = {}, private_settings = {}) {
    this.id = id;
    this.settings = settings;
    this.private_settings = private_settings;
  }
}

class ContextMock {
  constructor(id = "1234", settings = {}, private_settings = {}) {
    this.ship = new ShipMock(id, settings, private_settings);
    this.connector = new ShipMock(id, settings, private_settings);
    this.client = new ClientMock();
    this.metric = {
      increment: (name, value) => console.log(name, value),
      value: (name, value) => console.log(name, value)
    };
  }
}

module.exports = { ShipMock, ContextMock };
