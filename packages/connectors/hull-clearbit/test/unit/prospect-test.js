/* eslint-env node, mocha */
const assert = require("assert");
const { expect } = require("chai");
const sinon = require("sinon");
const _ = require("lodash");
const {
  shouldProspect,
  shouldProspectDomain,
  prospect
} = require("../../server/clearbit/prospect");

describe("prospect module", () => {
  const makeHullPost = ({ total = 2, without_email = 2, reveal = 2 }) =>
    Promise.resolve({
      pagination: {
        total
      },
      aggregations: {
        without_email: { doc_count: without_email },
        by_source: { buckets: [{ key: "reveal", doc_count: reveal }] }
      }
    });
  describe("shouldProspect Method", () => {
    const private_settings = {
      prospect_account_segments: ["1"]
    };
    it("should prospect if all ok", async () => {
      const res = await shouldProspect(private_settings, {
        account: { domain: "hull.io" },
        account_segments: [{ id: "1" }]
      });
      assert(res.should);
    });
    it("should not prospect if domain is empty", async () => {
      const res = await shouldProspect(private_settings, {
        account: { domain: "" },
        account_segments: [{ id: "1" }]
      });
      assert.deepStrictEqual(res, {
        should: false,
        message: "Can't find a domain"
      });
    });
    it("should not prospect if domain is undefined", async () => {
      const res = await shouldProspect(private_settings, {
        account: {},
        account_segments: [{ id: "1" }]
      });
      assert.deepStrictEqual(res, {
        should: false,
        message: "Can't find a domain"
      });
    });
    it("should not prospect if domain is null", async () => {
      const res = await shouldProspect(private_settings, {
        account: {},
        account_segments: [{ id: "1" }]
      });
      assert.deepStrictEqual(res, {
        should: false,
        message: "Can't find a domain"
      });
    });
    it("should not prospect if segments don't match", async () => {
      const res = await shouldProspect(private_settings, {
        account: { domain: "hull.io" },
        account_segments: [{ id: "2" }]
      });
      assert.deepStrictEqual(res, {
        should: false,
        message: "Account isn't in any prospectable segment"
      });
    });
    it("should not prospect if already prospected", async () => {
      const res = await shouldProspect(private_settings, {
        account: { domain: "hull.io", "clearbit/prospected_at": "2018-12-18" },
        account_segments: [{ id: "1" }]
      });
      assert.deepStrictEqual(res, {
        should: false,
        message: "We don't prospect the same domain twice"
      });
    });
  });

  describe("shouldProspectDomain", () => {
    const hull = {
      post: () => makeHullPost({})
    };
    const private_settings = {};
    it("Should exclude domains from `excluded` list", async () => {
      const domains = ["hull.io", "google.com", "hotmail.com"];
      const res = await Promise.all(
        domains.map(domain =>
          shouldProspectDomain({
            domain,
            hull,
            settings: private_settings
          })
        )
      );
      assert.deepStrictEqual(res, [
        { should: true },
        {
          should: false,
          message:
            "We don't prospect excluded domains. See https://github.com/hull-ships/hull-clearbit/blob/master/server/excludes.js"
        },
        {
          should: false,
          message:
            "We don't prospect excluded domains. See https://github.com/hull-ships/hull-clearbit/blob/master/server/excludes.js"
        }
      ]);
    });
    it("should not prospect if under required unique anonymous", async () => {
      const res = await shouldProspectDomain({
        domain: "hull.io",
        hull,
        settings: {
          ...private_settings,
          reveal_prospect_min_contacts: 3
        }
      });
      assert.deepStrictEqual(res, {
        should: false,
        message:
          "We are under the unique anonymous visitors threshold for prospecting"
      });
    });
    it("should not prospect if anonymous aren't from Reveal", async () => {
      const res = await shouldProspectDomain({
        domain: "hull.io",
        hull: {
          post: () => makeHullPost({ reveal: 0 })
        },
        settings: {
          ...private_settings,
          reveal_prospect_min_contacts: 2
        }
      });
      assert.deepStrictEqual(res, {
        should: false,
        message:
          "We are under the unique anonymous visitors threshold for prospecting"
      });
    });
    it("should prospect empty accounts if minimum anonymous is 0", async () => {
      const res = await shouldProspectDomain({
        domain: "hull.io",
        hull: {
          post: () => makeHullPost({ total: 0, without_email: 0, reveal: 0 })
        },
        settings: {
          ...private_settings,
          reveal_prospect_min_contacts: 0
        }
      });
      assert(res.should);
    });
    // BEHAVIOUR CHANGE: We're only reying on segments and user count
    // it("should exclude domains with non-anonymous users", async () => {
    //   const res = await shouldProspectDomain({
    //     domain: "hull_with_users.io",
    //     hull,
    //     settings: private_settings
    //   });
    //   assert(!res.should);
    //   assert.strictEqual(res.message, "We have known users in that domain");
    // });

    // BEHAVIOUR CHANGE: We're not relying on anonymous discovered users anymore
  });

  describe("prospect", () => {
    const settings = {
      lookup_domain: "domain",
      prospect_filter_seniorities: ["manager"],
      prospect_filter_titles: [],
      prospect_filter_cities: [],
      prospect_filter_states: [],
      prospect_filter_countries: [],
      prospect_filter_roles: ["ceo"],
      prospect_limit_count: 5
    };
    const hullio_account_message = { account: { domain: "hull.io" } };
    it("should return empty results if titles are empty", async () => {
      const res = await prospect({
        settings,
        client: {
          prospect: sinon.spy(q => {
            const { domain } = q;
            const email = _.map(
              _.omit(q, "domain"),
              (v, k) => `${k}=${v}`
            ).join("+");
            return Promise.resolve([{ email: `${email}@${domain}` }]);
          })
        },
        message: hullio_account_message
      });
      assert.deepStrictEqual(
        res.prospects[
          "roles=ceo+seniorities=manager+limit=5+email=true@hull.io"
        ],
        {
          email: "roles=ceo+seniorities=manager+limit=5+email=true@hull.io"
        }
      );
    });
    it("should call the api 3 times with 3 titles", async () => {
      let counter = 0;
      const prospector = sinon.spy(() => {
        counter += 1;
        return Promise.resolve([{ email: `${counter}@email.com` }]);
      });
      const res = await prospect({
        settings: {
          ...settings,
          prospect_filter_titles: ["veni", "vidi", "vici"],
          prospect_limit_count: 7
        },
        client: {
          prospect: prospector
        },
        message: hullio_account_message
      });
      assert.deepStrictEqual(res.prospects, {
        "1@email.com": { email: "1@email.com" },
        "2@email.com": { email: "2@email.com" },
        "3@email.com": { email: "3@email.com" }
      });
      assert.deepStrictEqual(prospector.firstCall.args, [
        {
          domain: "hull.io",
          roles: ["ceo"],
          email: true,
          title: "veni",
          limit: 7,
          seniorities: ["manager"]
        }
      ]);
      assert.deepStrictEqual(prospector.secondCall.args, [
        {
          domain: "hull.io",
          roles: ["ceo"],
          email: true,
          title: "vidi",
          limit: 6,
          seniorities: ["manager"]
        }
      ]);
      assert.deepStrictEqual(prospector.thirdCall.args, [
        {
          domain: "hull.io",
          roles: ["ceo"],
          email: true,
          title: "vici",
          limit: 5,
          seniorities: ["manager"]
        }
      ]);
      assert.strictEqual(counter, 3);
    });
    it("should call the API with the correct filters", async () => {
      let counter = 0;
      const prospector = sinon.spy(() => {
        counter += 1;
        return Promise.resolve([{ email: `${counter}@email.com` }]);
      });
      const res = await prospect({
        settings: {
          ...settings,
          prospect_filter_titles: ["veni", "vidi", "vici"],
          prospect_filter_cities: ["new york", "boston"],
          prospect_filter_countries: ["united states", "france"],
          prospect_filter_states: ["california", "washington"],
          prospect_limit_count: 7
        },
        client: {
          prospect: prospector
        },
        message: hullio_account_message
      });
      assert.deepStrictEqual(res.prospects, {
        "1@email.com": { email: "1@email.com" },
        "2@email.com": { email: "2@email.com" },
        "3@email.com": { email: "3@email.com" }
      });
      assert.deepStrictEqual(prospector.firstCall.args, [
        {
          domain: "hull.io",
          roles: ["ceo"],
          email: true,
          cities: ["new york", "boston"],
          states: ["california", "washington"],
          countries: ["united states", "france"],
          title: "veni",
          limit: 7,
          seniorities: ["manager"]
        }
      ]);
      assert.deepStrictEqual(prospector.secondCall.args, [
        {
          domain: "hull.io",
          roles: ["ceo"],
          email: true,
          cities: ["new york", "boston"],
          states: ["california", "washington"],
          countries: ["united states", "france"],
          title: "vidi",
          limit: 6,
          seniorities: ["manager"]
        }
      ]);
      assert.deepStrictEqual(prospector.thirdCall.args, [
        {
          domain: "hull.io",
          roles: ["ceo"],
          email: true,
          cities: ["new york", "boston"],
          states: ["california", "washington"],
          countries: ["united states", "france"],
          title: "vici",
          limit: 5,
          seniorities: ["manager"]
        }
      ]);
      assert.strictEqual(counter, 3);
    });
  });
});
