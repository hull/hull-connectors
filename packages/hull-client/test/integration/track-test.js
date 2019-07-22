const { expect } = require("chai");
const Minihull = require("minihull");

const Hull = require("../../src");

describe("client.track()", function test() {
  let client;
  let minihull;
  this.timeout(10000);
  beforeEach(() => {
    minihull = new Minihull();
    minihull.listen(8000);
    // process.env.BATCH_TIMEOUT = 300;
    // process.env.BATCH_RETRY = 10;
    client = new Hull({
      organization: "localhost:8000",
      id: "211111111111111111111111",
      secret: "rocks",
      protocol: "http",
      flushAfter: 100,
      timeout: 300,
      retry: 10,
      firehoseUrl: "http://localhost:8000/boom/firehose",
      domain: "hullapp.dev"
    });
  });

  afterEach(() => {
    minihull.close();
    // delete process.env.BATCH_TIMEOUT;
    // delete process.env.BATCH_RETRY;
  });

  // it("should set default event_id", async () => {
  //   const stub = minihull
  //     .stubApp("POST", "/boom/firehose")
  //     .callsFake((req, res) => {
  //       res.end("ok");
  //     });
  //   await client.asUser("123").track("Foo");
  //   const firstReq = minihull.requests
  //     .get("incoming")
  //     .get(0)
  //     .value();
  //   expect(firstReq.body.batch[0].body.event_id).to.not.be.empty;
  // });
  //
  // it("should not overwrite event_id if provided", async () => {
  //   const stub = minihull
  //     .stubApp("POST", "/boom/firehose")
  //     .callsFake((req, res) => {
  //       res.end("ok");
  //     });
  //   await client
  //     .asUser("123")
  //     .track("Foo", {}, { event_id: "someCustomValue" });
  //   const firstReq = minihull.requests
  //     .get("incoming")
  //     .get(0)
  //     .value();
  //   expect(firstReq.body.batch[0].body.event_id).to.equal("someCustomValue");
  // });

  // TODO -> Can't make Retries work with Minihull
  // Some weird thing going on with the callsFake method
  // it("shoud retry with the same event_id", async () => {
  //   const stub = minihull
  //     .stubApp("POST", "/boom/firehose")
  //     .onFirstCall()
  //     .callsFake((req, res) => {
  //       console.log("FIRSTCALL")
  //     });
  //   stub.onSecondCall()
  //     .callsFake((req, res) => {
  //       console.log("SECONDCALL", res)
  //       res.end("ok");
  //     });
  //
  //   await client.asUser("123").track("Foo");
  //   console.log("++++++++");
  //   expect(stub.callCount).to.be.eql(2);
  //   const firstReq = minihull.requests
  //     .get("incoming")
  //     .get(0)
  //     .value();
  //   const secondReq = minihull.requests
  //     .get("incoming")
  //     .get(1)
  //     .value();
  //   console.log(stub.callCount);
  //   console.log(firstReq);
  //   console.log(secondReq);
  //   expect(firstReq.body.batch[0].body.event_id).to.be.equal(
  //     secondReq.body.batch[0].body.event_id
  //   );
  // });
});
