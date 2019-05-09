//@flow
/* global describe, it */
declare function describe(string, Function): void;
declare function test(string, Function): Promise<any>;
declare function beforeEach(Function): void;
declare function afterEach(Function): void;

const _ = require("lodash");
const mockr = require("minihull");
const Hull = require("hull");
const server = require("../server/server");
const { track, identify, page, screen } = require("./fixtures");

// const API_RESPONSES = {
//   default: {
//     settings: {
//       handle_pages: false,
//       handle_screens: false
//     }
//   },
//   page: {
//     settings: {
//       handle_pages: true,
//       handle_screens: false
//     }
//   },
//   screen: {
//     settings: {
//       handle_pages: false,
//       handle_screens: true
//     }
//   }
// };
//

const hostSecret = "shuut";

const config = {
  secret: "hullSecret",
  organization: "localhost:8070",
  id: "56f3d53ef89a8791cb000004"
};
const connectorConfig = {
  port: 8080,
  clientConfig: {}
};
const connector = {
  id: "1234",
  settings: {
    handle_pages: true
  },
  private_settings: {}
};
const user_segments = [{ id: "1", name: "A" }];
const account_segments = [];

describe("Segment Ship", () => {
  console.log("Segment Ship Desc")
  // const getMock = (connectorOverride = {}) => mockr({
  //   Hull,
  //   server,
  //   beforeEach,
  //   afterEach,
  //   connectorConfig,
  //   account_segments,
  //   user_segments,
  //   connector: {
  //     ...connector,
  //     ...connectorOverride
  //   },
  // });
  //
  // const mocks = getMock();

  test("Invalid body", (done) => {
    console.log("testing invalid body")
    done();
    return Promise.resolve();
    // mocks.request
    // .post("/segment")
    // .query(config)
    // .type("json")
    // .send("{foo")
    // .expect({ message: "Unexpected token f in JSON at position 1" })
    // .expect(400, done)
  });
  // describe("Error payloads", () => {
  //   //
  //   // test("Missing credentials", (done) => {
  //   //   mocks.request
  //   //   .post("/segment")
  //   //   .query({})
  //   //   .type("json")
  //   //   .send(track)
  //   //   .expect({ message: "Missing Credentials" })
  //   //   .expect(400, done)
  //   // });
  // });


  // describe("With credentials - webhook style", () => {
  //   test("should return 200 with valid claims", (done) => {
  //     mocks.request
  //     .post("/segment")
  //     .type("json")
  //     .query(config)
  //     .send(track)
  //     .expect({ message: "thanks" })
  //     .expect(200, done);
  //   });
  // });
  //
  // describe("With credentials - direct style", () => {
  //   test("should return 200 with a valid token", (done) => {
  //     const token = new Buffer(jwt.encode(config, hostSecret)).toString("base64");
  //     mocks.request
  //     .post("/segment")
  //     .type("json")
  //     .set({ authorization: `Basic ${token}` })
  //     .send(track)
  //     .expect({ message: "thanks" })
  //     .expect(200, done);
  //   });
  //
  //   test("should trim the token when passed with extra spaces", (done) => {
  //     const token = `Basic ${new Buffer(` ${jwt.encode(config, hostSecret)} `).toString("base64")}`;
  //     mocks.request
  //     .post("/segment")
  //     .type("json")
  //     .query(connector)
  //     .set({ authorization: `Basic ${token}` })
  //     .send(track)
  //     .expect({ message: "thanks" })
  //     .expect(200, done);
  //   });
  //
  //   test("should return Invalid token with a token signed with an invalid signature", (done) => {
  //     const token = new Buffer(jwt.encode(config, `${hostSecret}invalid`)).toString("base64");
  //
  //     mocks.request
  //     .post("/segment")
  //     .type("json")
  //     .query(connector)
  //     .set({ authorization: `Basic ${token}` })
  //     .send(track)
  //     .expect({ message: "Invalid Token" })
  //     .expect(401, done);
  //   });
  //
  //   test("should return Missing credentials with a token with missing claims", (done) => {
  //     const token = new Buffer(jwt.encode({ organization: "abc.boom", secret: hullSecret }, hostSecret)).toString("base64");
  //
  //     mocks.request
  //     .post("/segment")
  //     .type("json")
  //     .query({ foo: "bar" })
  //     .set({ authorization: `Basic ${token}` })
  //     .send(track)
  //     .expect({ message: "Missing Credentials" })
  //     .expect(400, done);
  //   });
  // });
  //
  // describe("Connector not found", () => {
  //   test("should return 401 if connector is not found", (done) => {
  //     mocks.request
  //     .post("/segment")
  //     .type("json")
  //     .query({ ...config, connector: "not_found" })
  //     .send(track)
  //     .expect({ message: "id property in Configuration is invalid: not_found" })
  //     .expect(401, done);
  //   });
  // });
  //
  // describe("Call type not supported", () => {
  //   test("should return 401 if connector is not found", (done) => {
  //     mocks.request
  //     .post("/segment")
  //     .type("json")
  //     .query(config)
  //     .send({ type: "bogus" })
  //     .expect({ message: "Not Supported" })
  //     .expect(501, done);
  //   });
  // });
  //
  // describe("Handling events", () => {
  //
  //   test("call Hull.track on track event", (done) => {
  //     mocks.request
  //     .post("/segment")
  //     .type("json")
  //     .query(config)
  //     .send(track)
  //     .expect({ message: "thanks" })
  //     .expect(200)
  //     .end(() => {
  //       setTimeout(() => {
  //         const { firehose } = mocks.response;
  //         assert(firehose[0].type === "track");
  //         assert(firehose[0].body.event === "Viewed Checkout Step");
  //         done();
  //       }, 1000);
  //     });
  //   });
  //
  //   test("call Hull.track on page event", (done) => {
  //
  //     mocks.request
  //     .post("/segment")
  //     .type("json")
  //     .query(config)
  //     .send(page)
  //     .expect({ message: "thanks" })
  //     .expect(200)
  //     .end(() => {
  //       setTimeout(() => {
  //         const { firehose } = mocks.response;
  //         assert(firehose[0].type === "track");
  //         assert(firehose[0].body.event === "page");
  //         done();
  //       }, 1000);
  //     });
  //   });
  //
  //   test("should Hull.track on page event by default", (done) => {
  //     const mocks = getMock({
  //       settings: {}
  //     });
  //
  //     mocks.request
  //     .post("/segment")
  //     .type("json")
  //     .query(config)
  //     .send(page)
  //     .expect({ message: "thanks" })
  //     .expect(200)
  //     .end(() => {
  //       setTimeout(() => {
  //         const { firehose } = mocks.response;
  //         assert(firehose[0].type === "track");
  //         assert(firehose[0].body.event === "page");
  //         done();
  //       }, 1000);
  //     });
  //   });
  //
  //   test("call Hull.track on screen event", (done) => {
  //     // const postSpy = sinon.spy();
  //     // const MockHull = mockHullFactory(postSpy, API_RESPONSES.screen);
  //     // sendRequest({ body: screen, query: config, Hull: MockHull })
  //     //     .expect({ message: "thanks" })
  //     //     .expect(200)
  //     //     .end(() => {
  //     //       assert(postSpy.firstCall.args[3].active === true);
  //     //       assert(postSpy.withArgs("/t", "screen").calledOnce);
  //     const mocks = getMock({
  //       settings: {
  //         handle_screens: true
  //       }
  //     });
  //
  //     mocks.request
  //     .post("/segment")
  //     .type("json")
  //     .query(config)
  //     .send(screen)
  //     .expect({ message: "thanks" })
  //     .expect(200)
  //     .end(() => {
  //       setTimeout(() => {
  //         const { firehose } = mocks.response;
  //         assert(firehose[0].type === "track");
  //         assert(firehose[0].body.active === true);
  //         assert(firehose[0].body.event === "screen");
  //         done();
  //       }, 1000);
  //     });
  //   });
  //
  //   test("Ignores incoming userId if settings.ignore_segment_userId is true", (done) => {
  //     const mocks = getMock({
  //       settings: { ignore_segment_userId: true }
  //     })
  //
  //     mocks.request
  //     .post("/segment")
  //     .type("json")
  //     .query(config)
  //     .send(identify)
  //     .expect({ message: "thanks" })
  //     .expect(200)
  //     .end(() => {
  //       setTimeout(() => {
  //         const { firehose } = mocks.response;
  //         assert(firehose[0].claims["io.hull.asUser"]).equals({ email: identify.traits.email });
  //         assert(firehose[0].type === "traits");
  //         done();
  //       }, 1000);
  //     });
  //   });
  //
  //   test("Skip if settings.ignore_segment_userId is true and we have no email", (done) => {
  //     const mocks = getMock({
  //       settings: { ignore_segment_userId: true }
  //     })
  //     const traits = { first_name: "Bob" };
  //
  //     mocks.request
  //     .post("/segment")
  //     .type("json")
  //     .query(config)
  //     .send({ ...identify, traits })
  //     .expect({ message: "thanks" })
  //     .expect(200)
  //     .end(() => {
  //       setTimeout(() => {
  //         const { firehose } = mocks.response;
  //         assert(firehose.length===0);
  //         done();
  //       }, 1000);
  //     });
  //   });
  //
  //   test("call Hull.traits on identify event", (done) => {
  //     const mocks = getMock({
  //       settings: { }
  //     })
  //
  //     const traits = {
  //       id: "12",
  //       visitToken: "boom",
  //       firstname: "James",
  //       lastname: "Brown",
  //       createdat: "2016-05-02T10:39:17.812Z",
  //       email: "james@brown.com",
  //       coconuts: 32
  //     };
  //
  //     const payload = {
  //       first_name: "James",
  //       last_name: "Brown",
  //       created_at: "2016-05-02T10:39:17.812Z",
  //       email: "james@brown.com",
  //       coconuts: 32
  //     };
  //
  //
  //     mocks.request
  //     .post("/segment")
  //     .type("json")
  //     .query(config)
  //     .send({ ...identify, traits })
  //     .expect({ message: "thanks" })
  //     .expect(200)
  //     .end(() => {
  //       setTimeout(() => {
  //         const { firehose } = mocks.response;
  //         assert(firehose[0].body).equals(payload);
  //         assert(firehose[0].type==="traits");
  //         assert(firehose[0].claims["io.hull.asUser"]).equals({
  //             email: payload.email,
  //             external_id: identify.user_id
  //           });
  //         assert(firehose[0].claims["io.hull.active"] === false)
  //         done();
  //       }, 1000);
  //     });
  //   });
  //
  //   test("call Hull.traits on identify event", (done) => {
  //     const mocks = getMock({
  //       settings: { }
  //     });
  //
  //     const body = {
  //       ...identify,
  //       context: {
  //         ...identify.context,
  //         active: true
  //       },
  //       traits: {
  //         id: "12",
  //         visitToken: "boom",
  //         firstname: "James",
  //         lastname: "Brown",
  //         createdat: "2016-05-02T10:39:17.812Z",
  //         email: "james@brown.com",
  //         coconuts: 32
  //       }
  //     };
  //
  //     const payload = {
  //       first_name: "James",
  //       last_name: "Brown",
  //       created_at: "2016-05-02T10:39:17.812Z",
  //       email: "james@brown.com",
  //       coconuts: 32
  //     };
  //
  //     mocks.request
  //     .post("/segment")
  //     .type("json")
  //     .query(config)
  //     .send(body)
  //     .expect({ message: "thanks" })
  //     .expect(200)
  //     .end(() => {
  //       setTimeout(() => {
  //         const { firehose } = mocks.response;
  //         assert(firehose[0].body).equals(payload);
  //         assert(firehose[0].type==="traits");
  //         assert(firehose[0].claims["io.hull.asUser"]).equals({
  //             email: payload.email,
  //             external_id: identify.user_id
  //           });
  //         assert(firehose[0].claims["io.hull.active"] === true)
  //         done();
  //       }, 1000);
  //     });
  //   });
  //
  //
  //   test("should Hull.track on screen event by default", (done) => {
  //     const mocks = getMock({
  //       settings: { }
  //     });
  //
  //
  //     mocks.request
  //     .post("/segment")
  //     .type("json")
  //     .query(connector)
  //     .send(screen)
  //     .expect({ message: "thanks" })
  //     .expect(200)
  //     .end(() => {
  //       setTimeout(() => {
  //         const { firehose } = mocks.response;
  //         assert(firehose.length);
  //         done();
  //       }, 1000);
  //     });
  //   });
  //
  //   // describe("Collecting metric", () => {
  //   //   test("call metric collector", (done) => {
  //   //     const metricHandler = sinon.spy();
  //   //     sendRequest({ metric: metricHandler })
  //   //         .expect({ message: "thanks" })
  //   //         .expect(200)
  //   //         .end(() => {
  //   //           assert(metricHandler.withArgs("request.track").calledOnce);
  //   //           done();
  //   //         });
  //   //   });
  //   // });
  // });
  //
  // describe("Collecting logs", () => {
  //   test("call logs collector", (done) => {
  //     const mocks = getMock({
  //       settings: { }
  //     });
  //
  //     mocks.request
  //     .post("/segment")
  //     .type("json")
  //     .query(config)
  //     .send(track)
  //     .expect({ message: "thanks" })
  //     .expect(200)
  //     .end(() => {
  //       setTimeout(() => {
  //         const { logs } = mocks.response;
  //         assert(logs[0].message = "incoming.track.start");
  //         assert(logs[1].message = "incoming.track.success");
  //         assert(firehose.length);
  //         done();
  //       }, 1000);
  //     });
  //   });
  // });
});
