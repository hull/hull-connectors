/* global describe, it, after */
const { expect } = require("chai");
const sinon = require("sinon");

const HullConnector = require("../../../src/connector/hull-connector");
const { dependencies, config } = require("../../support/connector-config");

describe("HullConnector", () => {
  after(() => {
    process.removeAllListeners("exit");
  });

  it("should return an object of functions", () => {
    const connector = new HullConnector(dependencies, config);
    expect(connector).to.be.an("object");
    expect(connector.setupApp).to.be.a("function");
    expect(connector.startApp).to.be.a("function");
    expect(connector.Worker).to.be.a("function");
    expect(connector.startWorker).to.be.a("function");
  });

  it("should expose infrastucture objects", () => {
    const connector = new HullConnector(dependencies, config);
    expect(connector.instrumentation).to.be.an("object");
    expect(connector.queue).to.be.an("object");
    expect(connector.cache).to.be.an("object");
  });

  it("should return a worker method which returns worker app", () => {
    const connector = new HullConnector(dependencies, {
      ...config,
      workerConfig: { start: true }
    });
    const worker = new connector.Worker();
    expect(worker.use).to.be.a("function");
    expect(worker.process).to.be.a("function");
  });

  // it("should return a middleware method which returns Hull.Middleware instance", () => {
  //   const connector = new HullConnector(HullStub, HullMiddlewareStub);
  //   expect(connector.clientMiddleware).to.be.function;
  //   const middleware = connector.clientMiddleware();
  //   expect(middleware).to.be.function;
  // });

  it("should wrap express application with setupApp", () => {
    const expressMock = {
      use: () => {
        return this;
      },
      engine: () => {
        return this;
      },
      set: () => {
        return this;
      }
    };
    const connector = new HullConnector(dependencies, config);

    connector.setupApp(expressMock);
  });

  it("should allow passing name to clientConfig and to Hull Middleware", () => {
    const connector = new HullConnector(
      dependencies,
      { ...config, connectorName: "example" }
    );
    expect(connector.clientConfig.connectorName).to.be.eql("example");
  });

  it("should allow to set the name of internal queue", () => {
    const connector = new HullConnector(dependencies, {
      ...config,
      workerConfig: { start: true }
    });
    // connector.Worker();
    const processSpy = sinon.spy(connector._worker, "process");
    connector.startWorker("example");

    expect(processSpy.calledOnce).to.be.true;
    expect(processSpy.getCall(0).args[0]).to.be.equal("example");
  });

  it("should default name of internal queue to queueApp", () => {
    const connector = new HullConnector(dependencies, {
      ...config,
      workerConfig: { start: true }
    });
    // connector.Worker();
    const processSpy = sinon.spy(connector._worker, "process");
    connector.startWorker();

    expect(processSpy.calledOnce).to.be.true;
    expect(processSpy.getCall(0).args[0]).to.be.equal("queueApp");
  });

  it("should allow to setup custom middleware at the end of pre-handler middleware stack", () => {
    const appStub = {
      use: () => {},
      engine: () => {},
      set: () => {}
    };

    // const workerStub = {
    //   use: () => {},
    //   setJobs: () => {}
    // };

    const appUseSpy = sinon.spy(appStub, "use");
    // const workerUseSpy = sinon.spy(workerStub, "use");

    const customMiddleware = (req, res, next) => {};
    const connector = new HullConnector(dependencies, config);
    connector.use(customMiddleware);
    connector.setupApp(appStub);
    // connector._worker = workerStub;
    // connector.Worker({});

    expect(appUseSpy.called).to.be.true;
    expect(appUseSpy.lastCall.args[0]).to.be.eql(customMiddleware);

    // expect(workerUseSpy.called).to.be.true;
    // expect(workerUseSpy.lastCall.args[0]).to.be.eql(customMiddleware);
  });
});
