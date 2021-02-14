/* global describe, it */
import _ from "lodash";
import express from "express";
import bodyParser from "body-parser";
import Hull from "hull";

import request from "supertest";
import sinon from "sinon";
import assert from "assert";
import jwt from "jwt-simple";
import nock from "nock";

import updateUser from "../server/update-user";

const server = require("../server/server");
const { ContextMock } = require("./helper/connector-mock");


const {
  track,
  identify,
  page,
  screen,
  userUpdateEventPayload,
  userBatchUpdateMockMessage,
  userBatchUpdateRaw,
  userBatchUpdatePayload
} = require("./fixtures");

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
const hullSecret = "hullSecret";

const config = {
  secret: hullSecret,
  organization: "localhost:8070",
  ship: "56f3d53ef89a8791cb000004"
};

function sendRequest({ query, body, headers, metric, endpoint }) {
  const app = express();
  const connector = new Hull.Connector({
    hostSecret,
    clientConfig: { protocol: "http", flushAt: 1, flushAfter: 1, firehoseUrl: "firehose" }
  });
  connector.setupApp(app);
  const client = request(server(app, { clientMiddleware: connector.clientMiddleware(), hostSecret, onMetric: metric, Hull }));
  return client.post(endpoint || "/segment")
    .query(query || config)
    .set(headers || {})
    .type("json")
    .send(body || track);
}


describe("Segment Ship", () => {
  let requests = [];
  let testApp;
  let testServer;
  let shipData = {
    settings: { handle_pages: true }
  };

  afterEach((done) => {
    requests = [];
    testServer.close(done);
  });
  beforeEach((done) => {
    testApp = express();
    testApp.use(bodyParser.json());
    testApp.use(bodyParser.text());
    testApp.use((req, res, next) => {
      requests.push(_.pick(req, ["method", "url", "body", "query", "params"]));
      next();
    });
    testApp.all("/*", (req, res) => {
      res.json(shipData);
    });
    testServer = testApp.listen(8070, done);
  });

  describe("Error payloads", () => {
    it("Invalid body", (done) => {
      sendRequest({ body: "{boom" })
          .expect({ message: "Not Supported" })
          .expect(501, done);
    });

    it("Missing credentials", (done) => {
      sendRequest({ body: track, query: {} })
          .expect({ message: "Missing Credentials" })
          .expect(400, done);
    });
  });

  describe("With credentials - webhook style", () => {
    it("should return 200 with valid claims", (done) => {
      sendRequest({ body: track, query: config })
          .expect({ message: "thanks" })
          .expect(200, done);
    });
  });

  describe("With credentials - direct style", () => {
    it("should return 200 with a valid token", (done) => {
      const token = jwt.encode(config, hostSecret);
      sendRequest({ body: track, headers: { authorization: `Basic ${new Buffer(token).toString("base64")}` } })
          .expect({ message: "thanks" })
          .expect(200, done);
    });

    it("should trim the token when passed with extra spaces", (done) => {
      const token = jwt.encode(config, hostSecret);
      sendRequest({ body: track, headers: { authorization: `Basic ${new Buffer(` ${token} `).toString("base64")}` } })
          .expect({ message: "thanks" })
          .expect(200, done);
    });

    it("should return Invalid token with a token signed with an invalid signature", (done) => {
      const token = jwt.encode(config, `${hostSecret}invalid`);
      sendRequest({ body: track, headers: { authorization: `Basic ${new Buffer(token).toString("base64")}` } })
          .expect({ message: "Invalid Token" })
          .expect(401, done);
    });

    it("should return Missing credentials with a token with missing claims", (done) => {
      const token = jwt.encode({ organization: "abc.boom", secret: hullSecret }, hostSecret);
      sendRequest({
        query: { foo: "bar" },
        body: track,
        headers: {
          authorization: `Basic ${new Buffer(token).toString("base64")}`
        }
      })
      .expect({ message: "Missing Credentials" })
      .expect(400, done);
    });
  });

  describe("Ship not found", () => {
    it("should return 401 if ship is not found", (done) => {
      sendRequest({ body: track, query: { ...config, ship: "not_found" } })
          .expect({ message: "id property in Configuration is invalid: not_found" })
          .expect(401, done);
    });
  });

  describe("Call type not supported", () => {
    it("should return 401 if ship is not found", (done) => {
      sendRequest({ body: { type: "bogus" }, query: config })
          .expect({ message: "Not Supported" })
          .expect(501, done);
    });
  });

  describe("Handling events", () => {
    it("call Hull.track on track event", (done) => {
      sendRequest({ body: track, query: config })
        .expect({ message: "thanks" })
        .expect(200)
        .end(() => {
          setTimeout(() => {
            const tReq = _.find(requests, { url: "/api/v1/firehose" });
            assert(tReq.body.batch[0].type === "track");
            assert(tReq.body.batch[0].body.event === "Viewed Checkout Step");
            done();
          }, 10);
        });
    }).timeout(90000);
    it("call Hull.track on page event", (done) => {
      sendRequest({ body: page, query: config })
        .expect({ message: "thanks" })
        .expect(200)
        .end(() => {
          setTimeout(() => {
            const tReq = _.find(requests, { url: "/api/v1/firehose" });
            assert(tReq.body.batch[0].type === "track");
            assert(tReq.body.batch[0].body.event === "page");
            done();
          }, 10);
        });
    }).timeout(90000);
    it("should Hull.track on page event by default", (done) => {
      shipData = {
        settings: {}
      };
      sendRequest({ body: page, query: config })
        .expect({ message: "thanks" })
        .expect(200)
        .end(() => {
          setTimeout(() => {
            const tReq = _.find(requests, { url: "/api/v1/firehose" });
            assert(tReq);
            done();
          }, 10);
        });
    }).timeout(90000);
    it("call Hull.track on screen event", (done) => {
      // const postSpy = sinon.spy();
      // const MockHull = mockHullFactory(postSpy, API_RESPONSES.screen);
      // sendRequest({ body: screen, query: config, Hull: MockHull })
      //     .expect({ message: "thanks" })
      //     .expect(200)
      //     .end(() => {
      //       assert(postSpy.firstCall.args[3].active === true);
      //       assert(postSpy.withArgs("/t", "screen").calledOnce);
      shipData = {
        settings: {
          handle_screens: true
        }
      };
      sendRequest({ body: screen, query: config })
        .expect({ message: "thanks" })
        .expect(200)
        .end(() => {
          setTimeout(() => {
            const tReq = _.find(requests, { url: "/api/v1/firehose" });
            assert(tReq.body.batch[0].type === "track");
            assert(tReq.body.batch[0].body.active === true);
            assert(tReq.body.batch[0].body.event === "screen");
            done();
          }, 10);
        });
    }).timeout(90000);

    it("Ignores incoming userId if settings.ignore_segment_userId is true", (done) => {
      shipData = {
        settings: { ignore_segment_userId: true }
      };
      sendRequest({ body: { ...identify }, query: config })
        .expect(200)
        .expect({ message: "thanks" })
        .end(() => {
          setTimeout(() => {
            const tReq = _.find(requests, { url: "/api/v1/firehose" });
            const tokenClaims = jwt.decode(tReq.body.batch[0].headers["Hull-Access-Token"], hullSecret);
            assert(_.isEqual(tokenClaims["io.hull.asUser"], { email: identify.traits.email }));
            assert(tReq.body.batch[0].type === "traits");
            done();
          }, 10);
        });
    });

    it("Skip if settings.ignore_segment_userId is true and we have no email", (done) => {
      shipData = {
        settings: { ignore_segment_userId: true }
      };
      const traits = { first_name: "Bob" };
      sendRequest({ body: { ...identify, traits }, query: config })
        .expect(200)
        .expect({ message: "thanks" })
        .end(() => {
          setTimeout(() => {
            const tReq = _.find(requests, { url: "/api/v1/firehose" });
            assert(_.isNil(tReq));
            done();
          }, 10);
        });
    });

    it("call Hull.traits on identify event", (done) => {
      shipData = {
        settings: {}
      };
      const traits = {
        id: "12",
        visitToken: "boom",
        firstname: "James",
        lastname: "Brown",
        createdat: "2016-05-02T10:39:17.812Z",
        email: "james@brown.com",
        coconuts: 32
      };

      // const traitsSpy = sinon.spy();
      // const MockHull = mockHullFactory(traitsSpy, API_RESPONSES.default);
      sendRequest({ body: { ...identify, traits }, query: config })
        .expect(200)
        .expect({ message: "thanks" })
        .end(() => {
          const payload = {
            first_name: "James",
            last_name: "Brown",
            created_at: "2016-05-02T10:39:17.812Z",
            email: "james@brown.com",
            coconuts: 32
          };
          setTimeout(() => {
            const tReq = _.find(requests, { url: "/api/v1/firehose" });
            const tokenClaims = jwt.decode(tReq.body.batch[0].headers["Hull-Access-Token"], hullSecret);
            assert(_.isEqual(tokenClaims["io.hull.asUser"], { email: payload.email, external_id: identify.user_id }));
            const claims = jwt.decode(tReq.body.batch[0].headers["Hull-Access-Token"], null, true);
            assert(claims["io.hull.active"] === false);
            assert(tReq.body.batch[0].type === "traits");
            assert(_.isEqual(tReq.body.batch[0].body, payload));
            done();
          }, 10);
        });
    });

    it("call Hull.traits on identify event", (done) => {
      shipData = {
        settings: {}
      };
      const traits = {
        id: "12",
        visitToken: "boom",
        firstname: "James",
        lastname: "Brown",
        createdat: "2016-05-02T10:39:17.812Z",
        email: "james@brown.com",
        coconuts: 32
      };

      const body = {
        ...identify,
        context: {
          ...identify.context,
          active: true
        },
        traits
      };

      sendRequest({ body, query: config })
        .expect(200)
        .expect({ message: "thanks" })
        .end(() => {
          const payload = {
            first_name: "James",
            last_name: "Brown",
            created_at: "2016-05-02T10:39:17.812Z",
            email: "james@brown.com",
            coconuts: 32
          };
          setTimeout(() => {
            const tReq = _.find(requests, { url: "/api/v1/firehose" });
            const tokenClaims = jwt.decode(tReq.body.batch[0].headers["Hull-Access-Token"], hullSecret);
            assert(_.isEqual(tokenClaims["io.hull.asUser"], { email: payload.email, external_id: identify.user_id }));
            const claims = jwt.decode(tReq.body.batch[0].headers["Hull-Access-Token"], null, true);
            assert(claims["io.hull.active"] === true);
            assert(tReq.body.batch[0].type === "traits");
            assert(_.isEqual(tReq.body.batch[0].body, payload));
            done();
          }, 10);
        });
    });

    it("group call from segment should pull domain from traits", (done) => {
      shipData = {
        settings: { handle_accounts: true }
      };
      const body = {
        context: {
          library: {
            name: "analytics-node",
            version: "3.3.0"
          }
        },
        groupId: "BggDBQ4EBAMBDQkLBAcCDA",
        messageId: "node-74f9cac816a0076169db7321e5956638-0beacb8e-f988-4797-9320-dc3a55688b15",
        timestamp: "2018-10-25T14:49:26.269Z",
        traits: {
          account_status: "activated",
          name: "Hull Testpayload for Segment",
          domain: "somedomain.com",
          some_description: "a hull test payload description"
        },
        type: "group",
        userId: "DwcOAwYLAAMDCgMCBAMGCg",
        receivedAt: "2018-10-25T14:49:26.274Z",
        sentAt: "2018-10-25T14:49:25.887Z",
        integrations: {},
        originalTimestamp: "2018-10-25T14:49:25.882Z"
      };

      sendRequest({ body, query: config })
        .expect(200)
        .expect({ message: "thanks" })
        .end(() => {
          const payload = {
            account_status: "activated",
            name: "Hull Testpayload for Segment",
            domain: "somedomain.com",
            some_description: "a hull test payload description"
          };

          setTimeout(() => {
            const tReq = _.find(requests, { url: "/api/v1/firehose" });
            const tokenClaims = jwt.decode(tReq.body.batch[0].headers["Hull-Access-Token"], hullSecret);
            assert(_.isEqual(tokenClaims["io.hull.asAccount"], { domain: "somedomain.com", external_id: "BggDBQ4EBAMBDQkLBAcCDA" }));
            const claims = jwt.decode(tReq.body.batch[0].headers["Hull-Access-Token"], null, true);
            assert(claims["io.hull.subjectType"] === "account");
            assert(tReq.body.batch[0].type === "traits");
            assert(_.isEqual(tReq.body.batch[0].body, payload));
            done();
          }, 10);
        });
    });


    it("should Hull.track on screen event by default", (done) => {
      shipData = {
        settings: {}
      };
      sendRequest({ body: screen, query: config })
        .expect({ message: "thanks" })
        .expect(200)
        .end(() => {
          setTimeout(() => {
            const tReq = _.find(requests, { url: "/api/v1/firehose" });
            assert(tReq);
            done();
          }, 10);
        });
    });

    it("send update message to batch endpoint", (done) => {
      // nock the endpoint for batch url
      nock("http://somefakewebsite.com")
        .get("/getBatchPayload")
        .reply(200, userBatchUpdatePayload);

      // Right now the mock batch isn't pulling in the hull_segments
      // because the shipData isn't configured correctly
      // the way we inject the shipData isn't quite right I think
      const traits = {
        hull_segments: [],
        created_at: "2018-10-26T14:51:01Z"
      };

      // nock the segment endpoint that we send to..
      nock("https://api.segment.io")
        .post("/v1/batch", (body) => {
          return body.batch.length === 1
          && body.batch[0].type === "identify"
          && body.batch[0].anonymousId === "outreach:16"
          && _.isEqual(body.batch[0].traits, traits);
        })
        .reply(200);

      shipData = {
        id: "mockid",
        settings: {
          write_key: "fakekey",
          handle_accounts: true
        },
        private_settings: {
          synchronized_properties: [
            "created_at"
          ] }
      };
      sendRequest({
        body: userBatchUpdateRaw,
        endpoint: "/batch"
      })
        .expect({ message: "thanks" })
        .expect(200)
        .end(() => {
          setTimeout(() => {
            assert(nock.isDone());
            done();
          }, 100);
        });
    });

    describe("Collecting metric", () => {
      it("call metric collector", (done) => {
        const metricHandler = sinon.spy();
        sendRequest({ metric: metricHandler })
            .expect({ message: "thanks" })
            .expect(200)
            .end(() => {
              assert(metricHandler.withArgs("request.track").calledOnce);
              done();
            });
      });
    });
  });

  describe("Outgoing User Update Messages", () => {
    it("Event sent in User Update - Not in Segment", (done) => {
      const ctxMock = new ContextMock();
      ctxMock.ship = userUpdateEventPayload.connector;
      ctxMock.connector = userUpdateEventPayload.connector;

      const message = userUpdateEventPayload.messages[0];

      const analytics = {
        group: () => {},
        enqueue: () => {},
        page: () => {},
        track: () => {},
        identify: () => true,
      };

      sinon.spy(analytics, "group");
      sinon.spy(analytics, "enqueue");
      sinon.spy(analytics, "page");
      sinon.spy(analytics, "track");
      sinon.spy(analytics, "identify");

      const analyticsClient = () => analytics;

      const updateUserFunction = updateUser(analyticsClient);
      const updatedAttributes = updateUserFunction(
        {
          message
        },
        {
          ship: ctxMock.ship,
          hull: ctxMock.client
        }
      );

      const infoLogMock = ctxMock.client.logger.info;
      const debugLogMock = ctxMock.client.logger.debug;

      // In this first scenario, the user is in the segment we're synchronizing
      // But because there are no attribute updates, so we return false
      // But in this case, it's an event incoming not an attribute, so we still get a successful outgoing event
      assert(updatedAttributes === false);
      assert(analytics.page.getCalls().length === 1);
      assert(analytics.track.getCalls().length === 0);
      assert(analytics.group.getCalls().length === 0);
      assert(analytics.identify.getCalls().length === 0);
      assert(infoLogMock.getCalls()[infoLogMock.getCalls().length - 1].args[0] === "outgoing.event.success");
      assert(debugLogMock.getCalls()[infoLogMock.getCalls().length - 1].args[0] === "outgoing.user.skip");

      ctxMock.ship.private_settings.synchronized_segments = ["notarealsegment"];

      const updatedAttributes2 = updateUserFunction(
        {
          message
        },
        {
          ship: ctxMock.ship,
          hull: ctxMock.client
        }
      );

      // In this second scenario, we set the synchronized segment to be different than the one the user is in
      // We still get false because no attribute updates
      // But now we also skip anything having to do with the user
      assert(updatedAttributes2 === false);
      assert(analytics.page.getCalls().length === 1);
      assert(analytics.track.getCalls().length === 0);
      assert(analytics.group.getCalls().length === 0);
      assert(analytics.identify.getCalls().length === 0);
      assert(debugLogMock.getCalls()[infoLogMock.getCalls().length - 1].args[0] === "outgoing.user.skip");

      ctxMock.ship.private_settings.synchronized_segments = ["ALL"];

      const updatedAttributes3 = updateUserFunction(
        {
          message
        },
        {
          ship: ctxMock.ship,
          hull: ctxMock.client
        }
      );

      // In this third scenario, we set the synchronized segment to be ALL
      // it's a special segment that pushes anything through
      // But because there are no attribute updates, so we return false
      // But in this case, it's an event incoming not an attribute, so we still get a successful outgoing event
      assert(updatedAttributes3 === false);
      assert(analytics.page.getCalls().length === 2);
      assert(analytics.track.getCalls().length === 0);
      assert(analytics.group.getCalls().length === 0);
      assert(analytics.identify.getCalls().length === 0);
      assert(infoLogMock.getCalls()[infoLogMock.getCalls().length - 1].args[0] === "outgoing.event.success");
      assert(debugLogMock.getCalls()[infoLogMock.getCalls().length - 2].args[0] === "outgoing.user.skip");

      ctxMock.ship.private_settings.synchronized_segments = [];

      const updatedAttributes4 = updateUserFunction(
        {
          message
        },
        {
          ship: ctxMock.ship,
          hull: ctxMock.client
        }
      );

      // In this fourth scenario, we set the synchronized segment to be empty
      // The old pattern was if no segments are set, then we send everything
      // not the case anymore
      assert(updatedAttributes4 === false);
      assert(analytics.page.getCalls().length === 2);
      assert(analytics.track.getCalls().length === 0);
      assert(analytics.group.getCalls().length === 0);
      assert(analytics.identify.getCalls().length === 0);
      assert(debugLogMock.getCalls()[infoLogMock.getCalls().length - 1].args[0] === "outgoing.user.skip");

      done();
    });

    it("Event sent in User Update - Simulated batch call, no group", (done) => {
      const ctxMock = new ContextMock();
      ctxMock.ship = userBatchUpdateMockMessage.connector;
      ctxMock.connector = userBatchUpdateMockMessage.connector;

      const message = userBatchUpdateMockMessage.messages[0];

      const analytics = {
        group: () => {},
        enqueue: () => {},
        page: () => {},
        track: () => {},
        identify: () => true,
      };

      sinon.spy(analytics, "group");
      sinon.spy(analytics, "enqueue");
      sinon.spy(analytics, "page");
      sinon.spy(analytics, "track");
      sinon.spy(analytics, "identify");

      const analyticsClient = () => analytics;

      const updateUserFunction = updateUser(analyticsClient);
      const updatedAttributes = updateUserFunction(
        {
          message
        },
        {
          ship: ctxMock.ship,
          hull: ctxMock.client
        }
      );

      const infoLogMock = ctxMock.client.logger.info;
      const debugLogMock = ctxMock.client.logger.debug;

      // In this first scenario, the user is in the segment we're synchronizing
      // We update a attribute that's in the synchronized properties
      assert(updatedAttributes === true);

      // no events, so no page or track callse
      assert(analytics.page.getCalls().length === 0);
      assert(analytics.track.getCalls().length === 0);

      // we call group because "ignoreFilters is false"
      assert(analytics.group.getCalls().length === 1);
      // we call identify because a user is incoming
      assert(analytics.identify.getCalls().length === 1);

      // both the user and account are successful
      assert(infoLogMock.getCalls()[infoLogMock.getCalls().length - 1].args[0] === "outgoing.user.success");
      assert(infoLogMock.getCalls()[infoLogMock.getCalls().length - 2].args[0] === "outgoing.account.success");

      const updatedAttributes2 = updateUserFunction(
        {
          message
        },
        {
          ship: ctxMock.ship,
          hull: ctxMock.client,
          ignoreFilters: true
        }
      );

      // again, we are synchronizing the same attribute out of the synchronized properties list
      assert(updatedAttributes2 === true);

      // no event, so no calls there
      assert(analytics.page.getCalls().length === 0);
      assert(analytics.track.getCalls().length === 0);

      // this time we added the ignoreFilters=true, so there are no additional group calls
      // because we do not call group because it's a batch call
      assert(analytics.group.getCalls().length === 1);

      // still call identify because the user is incoming
      assert(analytics.identify.getCalls().length === 2);

      // user gets updated
      assert(infoLogMock.getCalls()[infoLogMock.getCalls().length - 1].args[0] === "outgoing.user.success");

      // skipping account because no properties in account_synchronized_properties
      // and no longer synchronizing segments anymore either...
      assert(debugLogMock.getCalls()[debugLogMock.getCalls().length - 1].args[0] === "outgoing.account.skip");

      done();
    });
  });

  // describe("Collecting logs", () => {
  //   it("call logs collector", (done) => {
  //     const log = sinon.spy();

  //     sendRequest({ logger: { debug: log, info: log } })
  //         .expect({ message: "thanks" })
  //         .expect(200)
  //         .end(() => {
  //           assert(log.withArgs("incoming.track.start").calledOnce);
  //           assert(log.withArgs("incoming.track.success").calledOnce);
  //           done();
  //         });
  //   });
  // });
});
