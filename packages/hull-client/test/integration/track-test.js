const { expect } = require("chai");
const Minihull = require("minihull");

const Hull = require("../../src");

describe("client.track()", function test() {
  let client, minihull;
  this.timeout(10000);
  beforeEach(() => {
    minihull = new Minihull();
    minihull.listen(8000);
    client = new Hull({
      organization: "localhost:8000",
      id: "211111111111111111111111",
      secret: "rocks",
      protocol: "http",
      flushAfter: 100,
      firehoseUrl: "http://localhost:8000/boom/firehose",
      domain: "hullapp.dev",
    });
    process.env.BATCH_TIMEOUT = 300;
    process.env.BATCH_RETRY = 10;
  });

  afterEach(() => {
    minihull.close();
    delete process.env.BATCH_TIMEOUT;
    delete process.env.BATCH_RETRY;
  });

  it("should set default event_id", (done) => {
    const stub = minihull.stubApp("POST", "/boom/firehose")
      .callsFake((req, res) => {
        res.end("ok");
      });
    client.asUser("123").track("Foo")
      .then(() => {
        const firstReq = minihull.requests.get("incoming").get(0).value();
        expect(firstReq.body.batch[0].body.event_id).to.not.be.empty;
        done();
      });
  });

  it("should not overwrite event_id if provided", (done) => {
    const stub = minihull.stubApp("POST", "/boom/firehose")
      .callsFake((req, res) => {
        res.end("ok");
      });
    client.asUser("123").track("Foo", {}, { event_id: "someCustomValue" })
      .then(() => {
        const firstReq = minihull.requests.get("incoming").get(0).value();
        expect(firstReq.body.batch[0].body.event_id).to.equal("someCustomValue");
        done();
      });
  });

  it("shoud retry with the same event_id", (done) => {
    const stub = minihull.stubApp("POST", "/boom/firehose")
      .onFirstCall()
      .callsFake((req, res) => {})
      .onSecondCall()
      .callsFake((req, res) => {
        res.end("ok");
      });

    client.asUser("123").track("Foo")
      .then(() => {
        expect(stub.callCount).to.be.eql(2);
        const firstReq = minihull.requests.get("incoming").get(0).value();
        const secondReq = minihull.requests.get("incoming").get(1).value();
        expect(firstReq.body.batch[0].body.event_id).to.be.equal(secondReq.body.batch[0].body.event_id);
        done();
      });
  });

});
