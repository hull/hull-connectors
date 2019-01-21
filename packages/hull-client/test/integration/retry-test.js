const { expect } = require("chai");
const Minihull = require("minihull");

const Hull = require("../../src");

describe("client retrying", function test() {
  let minihull, client;
  beforeEach(() => {
    minihull = new Minihull();
    client = new Hull({
      organization: "localhost:8000",
      id: "111111111111111111111111",
      secret: "rocks",
      protocol: "http"
    });
    return minihull.listen(8000);
  });

  afterEach(() => {
    return minihull.close();
  });

  it("should retry 2 times if get 503 response, then reject", () => {
    const stub = minihull.stubApp("/api/v1/testing")
      .callsFake((req, res) => {
        res.status(503).end("error 503");
      });

    return client.get("/testing")
      .catch(err => {
        expect(err).to.not.be.undefined;
        expect(stub.callCount).to.be.eql(3);
      });
  });

  it("should retry 2 times if get 502 response, then reject", () => {
    const stub = minihull.stubApp("/api/v1/testing")
      .callsFake((req, res) => {
        res.status(502).end("error 502");
      });

    return client.get("/testing")
      .catch(err => {
        expect(err).to.not.be.undefined;
        expect(stub.callCount).to.be.eql(3);
      });
  });

  it("should retry first 503 response, then resolve", () => {
    const stub = minihull.stubApp("/api/v1/testing")
      .onFirstCall()
      .callsFake((req, res) => {
        res.status(503).end("error 503");
      })
      .onSecondCall()
      .callsFake((req, res) => {
        res.end("ok")
      });

    return client.get("/testing")
      .then(() => {
        expect(stub.callCount).to.be.eql(2);
      });
  });

  it("shoud retry 2 times on timeout, then reject", () => {
    console.log("Test 1");
    const stub = minihull.stubApp("/api/v1/testing")
      .callsFake((req, res) => {
        console.log("Test 1 fake1");
      });
    console.log("Test 1a");
    return client.get("/testing", {}, { timeout: 20, retry: 10 })
      .catch(err => {
        console.log("Test 1b");
        expect(err.message).to.equal("Timeout of 20ms exceeded");
        expect(stub.callCount).to.be.eql(3);
      });
  });

  it("shoud retry first timeout, then resolve", () => {
    console.log("Test 2");
    const stub = minihull.stubApp("/api/v1/testing")
      .onFirstCall()
      .callsFake((req, res) => {
        console.log("Test 2 fake1");
      })
      .onSecondCall()
      .callsFake((req, res) => {
        console.log("Test 2 fake2");
        res.end("ok")
      });
      console.log("Test 2a");

    return client.get("/testing", {}, { timeout: 20, retry: 10 })
      .then(() => {
        console.log("Test 2b");
        expect(stub.callCount).to.be.eql(2);
      });
  });
});
