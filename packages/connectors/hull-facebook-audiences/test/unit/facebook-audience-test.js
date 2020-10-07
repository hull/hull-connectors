const assert = require("assert");
const FIXTURES = require("./support");
const FacebookAudience = require("../../server/lib/facebook-audience");
const { spy } = require("sinon");

describe("FacebookAudiences.flushUserUpdates", () => {
  it("should call audience ops", (done) => {
    const fakeAgent = {
      ship: {
        private_settings: {
          synchronized_segments: [
            "585a69b2d5536348cf000128", "585a69b2d5536348cf000129"
          ]
        }
      },
      getOrCreateAudienceForSegment: spy(),
      removeUsersFromAudience: spy(),
      addUsersToAudience: spy(),
      fetchAudiences: () => Promise.resolve({
        "585a69b2d5536348cf000128": "test1",
        "585a69b2d5536348cf000129": "test2"
      }),
      fetchAudienceDetails: () => Promise.resolve({
        "585a69b2d5536348cf000128": {
          id: 123,
          description: "test1"
        }
      })
    };

    FacebookAudience
      .flushUserUpdates(fakeAgent, [FIXTURES.user_update], {})
      .then(() => {
        assert(fakeAgent.removeUsersFromAudience.calledOnce);
        assert(fakeAgent.addUsersToAudience.calledOnce);
      })
      .then(done);
  });
});

describe("FacebookAudiences", () => {
  it("should increment metrics values", (done) => {
    const usedMetrics = new Map();

    const ship = {
      private_settings: {
        synchronized_segments: [
          "585a69b2d5536348cf000128", "585a69b2d5536348cf000129"
        ],
        facebook_access_token: "123",
        facebook_ad_account_id: "321",
        field_email: "email"
      }
    };

    const client = {
      logger: {
        info: (msg, data) => console.log(msg, data),
        error: (msg, data) => console.log(msg, data),
        debug: (msg, data) => console.log(msg, data),
        log: (msg, data) => console.log(msg, data)
      }
    };

    const segments = ["585a69b2d5536348cf000128"];
    const metric = {
      increment: (metricKey, value) => {
        if (usedMetrics.has(metricKey)) usedMetrics.set(metricKey, usedMetrics.get(metricKey) + Number(value));
        else usedMetrics.set(metricKey, value);
      }
    };

    const users = [{ email: "email@email.com" }];

    new FacebookAudience(ship, client, {}, segments, metric).addUsersToAudience("123", users);
    setTimeout(() => {
      assert(usedMetrics.get("ship.outgoing.users") === 1);
      assert(usedMetrics.get("ship.outgoing.users.add") === 1);
      assert(usedMetrics.get("ship.service_api.call") === 1);
      done();
    }, 100);
  });
});
