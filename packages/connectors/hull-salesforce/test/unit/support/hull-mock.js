const Promise = require("bluebird");

function getClientMock() {
  return {
    configuration: {},
    logger: {
      info: (msg, data) => console.log(msg, data),
      error: (msg, data) => console.log(msg, data),
      debug: (msg, data) => console.log(msg, data),
      log: (msg, data) => console.log(msg, data)
    },
    get: () => {
      return Promise.resolve({});
    },
    post: () => {
      return Promise.resolve({});
    },
    put: () => {
      return Promise.resolve({});
    }
  };
}

function getShipMock(private_settings = {}) {
  return { id: "123", private_settings };
}

function getContextMock(private_settings = {}) {
  return {
    client: getClientMock(),
    ship: getShipMock(private_settings),
    metric: {
      increment: () => {}
    }
  };
}


module.exports = {
  getClientMock,
  getShipMock,
  getContextMock
};
