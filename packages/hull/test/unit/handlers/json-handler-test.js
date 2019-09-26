/* global describe, it */
const { expect, should } = require("chai");
const sinon = require("sinon");
const httpMocks = require("node-mocks-http");
const { EventEmitter } = require("events");
const Promise = require("bluebird");
const HullStub = require("../../support/hull-stub");

const actionHandler = require("../../../src/handlers/json-handler/factory");
const clientCredentials = {
  id: "5c21c7a6b0c4ae18e1001123",
  secret: "1234",
  organization: "test.hull.local"
};
const cache = {
  wrap: () => {},
  set: () => {}
};
function buildContextBaseStub() {
  return {
    HullClient: HullStub,
    clientCredentials,
    connector: {},
    usersSegments: [],
    accountsSegments: [],
    connectorConfig: {
      hostSecret: "123"
    },
    cache
  };
}

describe("jsonHandler", () => {
  it("should support json values", done => {
    const request = httpMocks.createRequest({
      method: "POST",
      url: "/"
    });
    request.hull = {
      client: new HullStub(),
      connectorConfig: {
        hostSecret: "123"
      },
      connector: {},
      accountsSegments: [],
      usersSegments: [],
      clientCredentials,
      cache
    };
    const response = httpMocks.createResponse({ eventEmitter: EventEmitter });
    const { router } = actionHandler({
      method: "POST",
      callback: () => ({ status: 200, data: { ok: "done" } })
    });
    router.handle(request, response, err => {
      console.log(err);
    });
    response.on("end", () => {
      expect(response._isEndCalled()).to.be.ok;
      expect(response._getData()).to.equal('{"ok":"done"}');
      done();
    });
  });

  it("should support plain error return values", done => {
    const request = httpMocks.createRequest({
      method: "POST",
      url: "/"
    });
    request.hull = buildContextBaseStub();
    const response = httpMocks.createResponse({ eventEmitter: EventEmitter });
    actionHandler({
      method: "POST",
      callback: () => Promise.reject(new Error("Something went bad")),
      options: {
        respondWithError: true
      }
    }).router.handle(request, response, () => {});
    response.on("end", () => {
      expect(response._isEndCalled()).to.be.ok;
      expect(response._getData()).to.equal('{"error":"Something went bad"}');
      done();
    });
  });

  it("should support thrown errors", done => {
    const request = httpMocks.createRequest({
      method: "POST",
      url: "/"
    });
    request.hull = buildContextBaseStub();
    const response = httpMocks.createResponse({ eventEmitter: EventEmitter });
    actionHandler({
      method: "POST",
      callback: () => {
        throw new Error("thrown error");
      },
      options: { respondWithError: true }
    }).router.handle(request, response, () => {});
    response.on("end", () => {
      expect(response._isEndCalled()).to.be.ok;
      expect(response._getData()).to.equal('{"error":"thrown error"}');
      done();
    });
  });
});
