import assert from "assert";
import chai from "chai";
import chaiSubset from "chai-subset";
import mockr from "./support/mockr";
import server from "../../server/server";
import manifest from "../../manifest.json";
// import person from "../fixtures/person.json";
import company from "../fixtures/company.json";

const { expect } = chai;
chai.use(chaiSubset);

const debug = require("debug")("hull-test");

describe("Reveal action", () => {
  const connector = {
    id: "123456789012345678901234",
    private_settings: {
      api_key: "123",
      reveal_user_segments: ["1"]
    }
  };
  const mocks = mockr({
    server,
    beforeEach,
    afterEach,
    manifest,
    port: 8000,
    connector,
    segments: [
      {
        id: "1",
        name: "A"
      }
    ]
  });

  const ANONYMOUS_USER = {
    id: "1234",
    anonymous_ids: ["foobar-anonymous"],
    email: null,
    last_known_ip: "100.0.0.0"
  };
  const REVEAL_SUCCESS_RESPONSE = {
    ip: "100.0.0.0",
    fuzzy: true,
    domain: "uber.com",
    company
  };

  it("should properly reveal users and update account", async () => {
    mocks
      .nock("https://reveal.clearbit.com")
      .get(/v1\/companies\/find/)
      .query({ ip: "100.0.0.0" })
      .reply(200, REVEAL_SUCCESS_RESPONSE);

    const response = await mocks.minihull.userUpdate({
      connector,
      messages: [
        {
          user: ANONYMOUS_USER,
          segments: [{ id: "1" }]
        }
      ]
    });
    const { /* error,  */ batch, logs } = response;
    expect(batch.length).to.equal(2);
    expect(batch).to.containSubset([
      {
        type: "traits",
        claims: {
          "io.hull.asUser": { id: "1234", email: null },
          "io.hull.subjectType": "user"
        },
        body: {
          domain: {
            operation: "setIfNull",
            value: company.domain
          },
          address_city: { operation: "setIfNull", value: null },
          address_state: { operation: "setIfNull", value: null },
          picture: { operation: "setIfNull", value: null },
          last_name: { operation: "setIfNull", value: null },
          first_name: { operation: "setIfNull", value: null },
          "clearbit/fetched_at": { operation: "setIfNull" },
          "clearbit/revealed_at": { operation: "setIfNull" },
          "clearbit/source": { value: "reveal", operation: "setIfNull" }
        }
      }
    ]);
    expect(batch).to.containSubset([
      {
        type: "traits",
        claims: {
          "io.hull.asUser": { id: "1234", email: null },
          "io.hull.asAccount": {},
          "io.hull.subjectType": "account"
        },
        body: {
          domain: {
            operation: "setIfNull",
            value: company.domain
          },
          "clearbit/domain": company.domain,
          "clearbit/geo_state": company.geo.state,
          "clearbit/founded_year": company.foundedYear,
          "clearbit/fetched_at": { operation: "setIfNull" },
          "clearbit/revealed_at": { operation: "setIfNull" },
          "clearbit/source": { value: "reveal", operation: "setIfNull" }
        }
      }
    ]);
    expect(batch[0].body["clearbit/fetched_at"].value).to.not.equal(null);
    expect(batch[1].body["clearbit/fetched_at"].value).to.not.equal(null);
    expect(batch[0].body["clearbit/revealed_at"].value).to.not.equal(null);
    expect(batch[1].body["clearbit/revealed_at"].value).to.not.equal(null);
    expect(batch[0].body["clearbit/source"].value).to.equal("reveal");
    expect(batch[1].body["clearbit/source"].value).to.equal("reveal");
    debug(logs);
    expect(logs);
  });

  // it("should properly reveal accounts if accounts enabled", done => {
  //   mocks
  //     .nock("https://reveal.clearbit.com")
  //     .get(/v1\/companies\/find/)
  //     .query({ ip: "100.0.0.0" })
  //     .reply(200, {
  //       ip: "100.0.0.0",
  //       fuzzy: true,
  //       domain: "hull.io",
  //       company: {
  //         domain: "hull.io",
  //         name: "Hull",
  //         tags: [
  //           "Software",
  //           "SAAS",
  //           "B2B",
  //           "Information Technology & Services",
  //           "Technology",
  //           "Internet"
  //         ],
  //         metrics: {
  //           alexaUsRank: 1,
  //           alexaGlobalRank: 1,
  //           employees: 1000,
  //           employeesRange: "1000-2000",
  //           raised: 100000000
  //         }
  //       }
  //     });
  //
  //   mocks.minihull.userUpdate(
  //     {
  //       connector: {
  //         id: "123456789012345678901234",
  //         private_settings: {
  //           api_key: "123",
  //           reveal_enabled: true,
  //           reveal_user_segments: ["1"]
  //         }
  //       },
  //       messages: [
  //         {
  //           user: {
  //             id: "1234",
  //             anonymous_ids: ["foobar-anonymous"],
  //             email: null,
  //             last_known_ip: "100.0.0.0"
  //           },
  //           segments: [{ id: "1" }]
  //         }
  //       ]
  //     },
  //     ({ batch, logs }) => {
  //       const [first, second] = batch;
  //       expect(batch.length).to.equal(2);
  //       expect(first.type).to.equal("traits");
  //       expect(first.body["clearbit/source"].value).to.equal("reveal");
  //
  //       expect(first.body["clearbit/revealed_at"].value).to.not.be.null;
  //       expect(first.body["clearbit/revealed_at"].operation).to.eql(
  //         "setIfNull"
  //       );
  //       expect(first.body["clearbit/fetched_at"].value).to.not.be.null;
  //       expect(first.body["clearbit/fetched_at"].operation).to.eql("setIfNull");
  //
  //       expect(second.type).to.equal("traits");
  //       expect(second.claims["io.hull.asAccount"].domain).to.equal("hull.io");
  //       expect(second.claims["io.hull.subjectType"]).to.equal("account");
  //       expect(second.body.domain.value).to.equal("hull.io");
  //       expect(second.body.domain.operation).to.equal("setIfNull");
  //       expect(second.body.name.value).to.equal("Hull");
  //       expect(second.body["clearbit/domain"]).to.equal("hull.io");
  //       expect(second.body["clearbit/metrics_alexa_global_rank"]).to.equal(1);
  //       done();
  //     }
  //   );
  // });
});
