const Promise = require("bluebird");
const _ = require("lodash");

class ClientMock {
  constructor() {
    this.configuration = { secret: "topsecret123" };
    this.logger = {
      info: jest.fn((msg, data) => console.log(msg, data)),
      debug: jest.fn((msg, data) => console.log(msg, data)),
      error: jest.fn((msg, data) => console.log(msg, data)),
      warn: jest.fn((msg, data) => console.log(msg, data)),
      log: jest.fn((msg, data) => console.log(msg, data))
    };
    this.get = jest.fn(() => Promise.resolve());
    this.post = jest.fn(() => Promise.resolve());
    this.put = jest.fn(() => Promise.resolve());
    this.traits = jest.fn(() => Promise.resolve());
    this.track = jest.fn(() => Promise.resolve());
    this.asUser = jest.fn(() => this);
    this.asAccount = jest.fn(() => this);
    this.account = jest.fn(() => this);
    this.utils = {
      groupTraits: (user) => {
        return _.reduce(user, (grouped, value, key) => {
          let dest = key;
          if (key.match(/^traits_/)) {
            if (key.match(/\//)) {
              dest = key.replace(/^traits_/, "");
            } else {
              dest = key.replace(/^traits_/, "traits/");
            }
          }
          return _.setWith(grouped, dest.split("/"), value, Object);
        }, {});
      },
      traits: {
        group: (data) => {
          return _.reduce(data, (grouped, value, key) => {
            let dest = key;
            if (key.match(/^traits_/)) {
              if (key.match(/\//)) {
                dest = key.replace(/^traits_/, "");
              } else {
                dest = key.replace(/^traits_/, "traits/");
              }
            }
            return _.setWith(grouped, dest.split("/"), value, Object);
          }, {});
        }
      }
    };
  }
}

module.exports = { ClientMock };
