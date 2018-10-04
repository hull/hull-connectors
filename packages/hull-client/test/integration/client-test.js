/* global it, describe */

const _ = require("lodash");
const chai = require("chai");
const sinonChai = require("sinon-chai");

const expect = chai.expect;
chai.use(sinonChai);
chai.should();

const Client = require("../../src/index");

const config = {
  id: "550964db687ee7866d000057",
  secret: "abcd12345",
  organization: "hull-demos"
};

describe("API client", () => {
  it("should return a client when called as a constructor", () => {
    const hull = new Client(config);
    hull.should.be.instanceof(Client);
  });


  it("should throw an error when being called without new", () => {
    const clientConstructor = Client;
    expect(() => {
      clientConstructor(config);
    }).to.throw(TypeError, "Class constructor HullClient cannot be invoked without 'new'");
  });

  it("should have methods for the http verbs", () => {
    const hull = new Client(config);
    const PUBLIC_METHODS = [
      "get", "post", "put", "del",
      "configuration",
      "api"
    ];

    PUBLIC_METHODS.map(method => expect(hull[method]).to.be.a("function"));
  });

  describe("minimal configuration", () => {
    it("should require `id`", () => {
      expect(() => new Client(_.omit(config, "id"))).to.throw();
    });
    it("should require `secret`", () => {
      expect(() => new Client(_.omit(config, "secret"))).to.throw();
    });
    it("should require `organization`", () => {
      expect(() => new Client(_.omit(config, "organization"))).to.throw();
    });

    it("should require a valid `id`", () => {
      expect(() => new Client(_.extend({}, config, { id: true }))).to.throw();
    });
    it("should require a valid `secret`", () => {
      expect(() => new Client(_.extend({}, config, { secret: true }))).to.throw();
    });
    it("should require a valid `organization`", () => {
      expect(() => new Client(_.extend({}, config, { organization: true }))).to.throw();
    });

    it("`version` should be forced to package.json value", () => {
      const conf = new Client(_.extend({}, config, { version: "test" })).configuration();
      conf.version.should.eql(require("../../package.json").version);
    });
  });
});

