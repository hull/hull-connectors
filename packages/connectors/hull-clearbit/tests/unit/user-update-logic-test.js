/* eslint-env node, mocha */
const assert = require("assert");
const sinon = require("sinon");
const moment = require("moment");
const Clearbit = require("../../server/clearbit").default;
const userUpdateLogic = require("../../server/lib/user-update-logic").default;

describe("User Update Logic", () => {
  const makeHull = () => {
    const mock = {};
    mock.logger = { info: () => {} };
    mock.configuration = () => ({
      id: 1,
      secret: 1,
      organization: "foo.hullapp.io"
    });
    mock.traits = sinon.spy(() => Promise.resolve());
    mock.asUser = sinon.spy(() => mock);
    return mock;
  };

  const makeClearbit = (private_settings = {}) => {
    const client = makeHull();
    const metric = { increment: () => {} };
    const clearbit = new Clearbit({
      connector: { private_settings },
      hull: client,
      metric
    });
    const revealSpy = sinon.spy();
    const enrichSpy = sinon.spy();
    const similarSpy = sinon.spy();
    const prospectSpy = sinon.spy();
    clearbit.reveal = revealSpy;
    clearbit.enrich = enrichSpy;
    clearbit.discover = similarSpy;
    clearbit.prospect = prospectSpy;
    clearbit.client = {};
    return { client, clearbit, revealSpy, enrichSpy, similarSpy, prospectSpy };
  };

  it("should not do anything if no segments active", () => {
    const cb = makeClearbit({
      enrich_user_segments: [],
      reveal_segments: [],
      enrich_account_segments: [],
      prospect_account_segments: [],
      discover_account_segments: []
    });
    const message = {
      user: { last_known_ip: "1.2.3.4", email: "foo@bar.com" },
      account: { domain: "foo.com" },
      account_segments: [{ id: "1" }],
      segments: [{ id: "1" }]
    };
    userUpdateLogic({ message, clearbit: cb.clearbit, client: cb.client });
    assert(cb.revealSpy.notCalled);
    assert(cb.enrichSpy.notCalled);
    assert(cb.similarSpy.notCalled);
    assert(cb.prospectSpy.notCalled);
  });

  it("should reveal anonymous users", () => {
    const cb = makeClearbit({
      enrich_user_segments: ["1"],
      reveal_segments: ["1"],
      enrich_account_segments: [],
      prospect_account_segments: [],
      discover_account_segments: []
    });
    const message = {
      user: { last_known_ip: "1.2.3.4", email: undefined },
      segments: [{ id: "1" }]
    };
    userUpdateLogic({ message, clearbit: cb.clearbit, client: cb.client });
    assert(cb.revealSpy.called);
    assert(cb.enrichSpy.notCalled);
    assert(cb.similarSpy.notCalled);
    assert(cb.prospectSpy.notCalled);
  });

  it("should enrich and reveal users with an email", () => {
    const cb = makeClearbit({
      enrich_user_segments: ["1"],
      reveal_segments: ["1"]
    });
    const message = {
      user: { last_known_ip: "1.2.3.4", email: "foo@bar.com" },
      segments: [{ id: "1" }]
    };
    userUpdateLogic({ message, clearbit: cb.clearbit, client: cb.client });
    assert(cb.revealSpy.called);
    assert(cb.enrichSpy.called);
    assert(cb.similarSpy.notCalled);
    assert(cb.prospectSpy.notCalled);
  });

  it("should not reveal Users with a company", () => {
    const cb = makeClearbit({
      enrich_user_segments: [],
      reveal_segments: ["1"]
    });
    const message = {
      user: {
        last_known_ip: "1.2.3.4"
      },
      account: {
        "clearbit/id": "1234"
      },
      segments: [{ id: "1" }],
      account_segments: [{ id: "1" }]
    };
    userUpdateLogic({ message, clearbit: cb.clearbit, client: cb.client });
    assert(cb.revealSpy.notCalled);
    assert(cb.enrichSpy.notCalled);
    assert(cb.similarSpy.notCalled);
    assert(cb.prospectSpy.notCalled);
  });

  it("should not do anything for already enriched and revealed users", () => {
    const cb = makeClearbit({
      enrich_user_segments: ["1"],
      reveal_segments: ["1"]
    });
    const message = {
      user: {
        last_known_ip: "1.2.3.4",
        email: "foo@bar.com",
        "traits_clearbit/id": "1234",
        "traits_clearbit/revealed_at": "1234",
        "traits_clearbit/enriched_at": "1234"
      },
      segments: [{ id: "1" }]
    };
    userUpdateLogic({ message, clearbit: cb.clearbit, client: cb.client });
    assert(cb.revealSpy.notCalled);
    assert(cb.enrichSpy.notCalled);
    assert(cb.similarSpy.notCalled);
    assert(cb.prospectSpy.notCalled);
  });

  it("should not do anything for users in wrong segments", () => {
    const cb = makeClearbit({
      enrich_user_segments: ["1"],
      reveal_segments: ["1"]
    });
    const message = {
      user: {
        last_known_ip: "1.2.3.4",
        email: "foo@bar.com",
        "traits_clearbit/enriched_at": "1234"
      },
      segments: [{ id: "2" }]
    };
    userUpdateLogic({ message, clearbit: cb.clearbit, client: cb.client });
    assert(cb.revealSpy.notCalled);
    assert(cb.enrichSpy.notCalled);
    assert(cb.similarSpy.notCalled);
    assert(cb.prospectSpy.notCalled);
  });

  it("should enrich Revealed Users without enrichment data", () => {
    const cb = makeClearbit({
      enrich_user_segments: ["1"],
      reveal_segments: ["1"]
    });
    const message = {
      user: {
        last_known_ip: "1.2.3.4",
        email: "foo@bar.com",
        "traits_clearbit/revealed_at": moment().format(),
        "traits_clearbit_company/id": "1234"
      },
      segments: [{ id: "1" }]
    };
    userUpdateLogic({ message, clearbit: cb.clearbit, client: cb.client });
    assert(cb.revealSpy.notCalled);
    assert(cb.enrichSpy.called);
    assert(cb.similarSpy.notCalled);
    assert(cb.prospectSpy.notCalled);
  });

  // POTENTIAL BEHAVIOUR CHANGE: => do we want to allow enriched users to be revealed?
  // If so, how do we combine this with them belonging to an account with Enrich data
  // it("should reveal enriched Users without reveal data", () => {
  //   const cb = makeClearbit({
  //     enrich_user_segments: ["1"],
  //     reveal_segments: ["1"]
  //   });
  //   const message = {
  //     user: {
  //       last_known_ip: "1.2.3.4",
  //       email: "foo@bar.com",
  //       "traits_clearbit/enriched_at": moment().format()
  //     },
  //     account: {
  //       "clearbit/id": "1234"
  //     },
  //     segments: [{ id: "1" }]
  //   };
  //   userUpdateLogic({ message, clearbit: cb.clearbit, client: cb.client });
  //   assert(cb.revealSpy.called);
  //   assert(cb.enrichSpy.notCalled);
  //   assert(cb.similarSpy.notCalled);
  //   assert(cb.prospectSpy.notCalled);
  // });

  // it("should not enrich or Reveal Users with Enrichment data", () => {
  //   const cb = makeClearbit({
  //     enrich_user_segments: ["1"],
  //     reveal_segments: ["1"]
  //   });
  //   const message = {
  //     user: {
  //       last_known_ip: "1.2.3.4",
  //       email: "foo@bar.com",
  //       "traits_clearbit/enriched_at": moment().format(),
  //       "traits_clearbit/revealed_at": moment().format(),
  //       "traits_clearbit_company/id": "1234"
  //     },
  //     segments: [{ id: "1" }]
  //   };
  //   userUpdateLogic({ message, clearbit: cb.clearbit, client: cb.client });
  //   assert(cb.revealSpy.notCalled);
  //   assert(cb.enrichSpy.notCalled);
  //   assert(cb.similarSpy.notCalled);
  //   assert(cb.prospectSpy.notCalled);
  // });
});
