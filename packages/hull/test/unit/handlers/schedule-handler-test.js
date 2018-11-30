/* global describe, it */
const { expect, should } = require("chai");
const sinon = require("sinon");
const httpMocks = require("node-mocks-http");
const { EventEmitter } = require("events");
const Promise = require("bluebird");
const HullStub = require("../support/hull-stub");
const { ConfigurationError, TransientError } = require("../../../src/errors");

const scheduleHandler = require("../../../src/handlers/schedule-handler/factory");

function buildContextBaseStub() {
  return {
    HullClient: HullStub,
    clientCredentials: {
      id: "5c21c7a6b0c4ae18e1001123",
      secret: "1234",
      organization: "test.hull.local"
    },
    connectorConfig: {
      hostSecret: "123"
    },
    cache: {
      wrap: () => {}
    }
  };
}

describe("scheduleHandler", () => {
  it("should support json values", (done) => {
    const request = httpMocks.createRequest({
      method: "POST",
      url: "/",
      body: {
        connector: {},
        users_segments: [],
        accounts_segments: [],
      }
    });
    request.hull = buildContextBaseStub();
    const response = httpMocks.createResponse({ eventEmitter: EventEmitter });
    scheduleHandler(() => {
      return Promise.resolve({ ok: "done" });
    }).handle(request, response, (err) => { console.log(err) });
    response.on("end", () => {
      expect(response._isEndCalled()).to.be.ok;
      expect(response._getData()).to.equal('{"ok":"done"}');
      done();
    });
  });

  it("should support plain error return values", (done) => {
    const request = httpMocks.createRequest({
      method: "POST",
      url: "/",
      body: {
        connector: {},
        users_segments: [],
        accounts_segments: [],
      }
    });
    request.hull = buildContextBaseStub();
    const response = httpMocks.createResponse({ eventEmitter: EventEmitter });
    scheduleHandler({
      callback: () => {
        return Promise.reject(new Error("Something went bad"));
      }
    }).handle(request, response, (err) => {
      done();
    });
  });

  it("should support thrown errors", (done) => {
    const request = httpMocks.createRequest({
      method: "POST",
      url: "/"
    });
    request.hull = buildContextBaseStub();
    const response = httpMocks.createResponse({ eventEmitter: EventEmitter });
    scheduleHandler({
      callback: () => {
        throw new Error("thrown error");
      }
    }).handle(request, response, () => {
      done();
    });
  });

  it("should support fire&forget strategy", (done) => {
    const request = httpMocks.createRequest({
      method: "POST",
      url: "/",
      body: {
        connector: {},
        users_segments: [],
        accounts_segments: [],
      }
    });
    request.hull = buildContextBaseStub();
    const response = httpMocks.createResponse({ eventEmitter: EventEmitter });
    scheduleHandler({
      callback: () => {
        return Promise.resolve({ ok: "done" });
      },
      options: {
        fireAndForget: true
      }
    }).handle(request, response, (err) => { console.log(err) });
    response.on("end", () => {
      expect(response._isEndCalled()).to.be.ok;
      expect(response._getData()).to.equal('{"status":"deffered"}');
      done();
    });
  });

  it("should capture errors in fire&forget mode", (done) => {
    const request = httpMocks.createRequest({
      method: "POST",
      url: "/",
      body: {
        connector: {},
        users_segments: [],
        accounts_segments: [],
      }
    });
    request.hull = buildContextBaseStub();
    request.hull.metric = {
      mergeContext: () => {},
      increment: () => {},
      captureException: (error) => {
        expect(error.message).to.equal("boom");
        done();
      }
    };
    const response = httpMocks.createResponse({ eventEmitter: EventEmitter });
    scheduleHandler({
      callback: () => {
        return Promise.reject(new Error("boom"));
      },
      options: {
        fireAndForget: true
      }
    }).handle(request, response, (err) => { console.log(err) });
    response.on("end", () => {
      expect(response._isEndCalled()).to.be.ok;
      expect(response._getData()).to.equal('{"status":"deffered"}');
    });
  });

  it("should not capture configuration errors in fire&forget mode", (done) => {
    const request = httpMocks.createRequest({
      method: "POST",
      url: "/",
      body: {
        connector: {},
        users_segments: [],
        accounts_segments: [],
      }
    });
    request.hull = buildContextBaseStub();
    request.hull.metric = {
      mergeContext: () => {},
      increment: () => {},
      captureException: (error) => {
        expect(false).to.equal(true);
      }
    };
    setTimeout(() => {
      done();
    }, 300);
    const response = httpMocks.createResponse({ eventEmitter: EventEmitter });
    scheduleHandler({
      callback: () => {
        return Promise.reject(new ConfigurationError("boom"));
      },
      options: {
        fireAndForget: true
      }
    }).handle(request, response, (err) => { console.log(err) });
    response.on("end", () => {
      expect(response._isEndCalled()).to.be.ok;
      expect(response._getData()).to.equal('{"status":"deffered"}');
    });
  });

  it("should not capture transient errors in fire&forget mode", (done) => {
    const request = httpMocks.createRequest({
      method: "POST",
      url: "/",
      body: {
        connector: {},
        users_segments: [],
        accounts_segments: [],
      }
    });
    request.hull = buildContextBaseStub();
    request.hull.metric = {
      mergeContext: () => {},
      increment: () => {},
      captureException: (error) => {
        expect(false).to.equal(true);
      }
    };
    setTimeout(() => {
      done();
    }, 300);
    const response = httpMocks.createResponse({ eventEmitter: EventEmitter });
    scheduleHandler({
      callback: () => {
        return Promise.reject(new TransientError("boom"));
      },
      options: {
        fireAndForget: true
      }
    }).handle(request, response, (err) => { console.log(err) });
    response.on("end", () => {
      expect(response._isEndCalled()).to.be.ok;
      expect(response._getData()).to.equal('{"status":"deffered"}');
    });
  });
});
