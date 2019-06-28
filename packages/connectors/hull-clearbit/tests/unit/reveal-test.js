/* eslint-env node, mocha */
const assert = require("assert");
const { expect } = require("chai");
const sinon = require("sinon");

const { shouldReveal } = require("../../server/clearbit/reveal");

describe("enrich module", () => {
  describe("canReveal", () => {
    it("can reveal if everything is OK", () => {
      assert.deepStrictEqual(
        shouldReveal(
          {
            reveal_segments: ["1"]
          },
          {
            segments: [{ id: "1" }],
            user: { id: "1234", last_known_ip: "1.2.3.4" }
          }
        ),
        {
          should: true
        }
      );
    });
    it("can reveal even if there is an email present", () => {
      assert.deepStrictEqual(
        shouldReveal(
          {
            reveal_segments: ["1"]
          },
          {
            segments: [{ id: "1" }],
            user: { id: "1234", last_known_ip: "1.2.3.4", email: "foo@bar.com" }
          }
        ),
        {
          should: true
        }
      );
    });
    it("can reveal even if users have been enriched", () => {
      assert.deepStrictEqual(
        shouldReveal(
          {
            reveal_segments: ["1"]
          },
          {
            segments: [{ id: "1" }],
            user: {
              id: "1234",
              last_known_ip: "1.2.3.4",
              "traits_clearbit/enriched_at": "2018"
            }
          }
        ),
        {
          should: true
        }
      );
    });

    it("can't reveal users without an IP", () => {
      assert.deepStrictEqual(
        shouldReveal(
          {
            reveal_segments: ["1"]
          },
          {
            segments: [{ id: "1" }],
            user: { id: "1234" }
          }
        ),
        {
          should: false,
          message: "Cannot reveal because missing IP"
        }
      );
    });
    it("can't reveal users if segments don't match", () => {
      assert.deepStrictEqual(
        shouldReveal(
          {
            reveal_segments: ["1"]
          },
          {
            segments: [{ id: "2" }],
            user: { id: "1234", last_known_ip: "1.2.3.4", email: "foo@bar.com" }
          }
        ),
        {
          should: false,
          message: "Reveal segments are defined but user isn't in any of them"
        }
      );
    });
    it("can't reveal users if account has a clearbit ID already", () => {
      assert.deepStrictEqual(
        shouldReveal(
          {
            reveal_segments: ["1"]
          },
          {
            segments: [{ id: "1" }],
            user: {
              id: "1234",
              last_known_ip: "1.2.3.4",
              email: "foo@bar.com"
            },
            account: { id: "1234", "clearbit/id": "1234" }
          }
        ),
        {
          should: false,
          message: "Clearbit Company ID present on Account"
        }
      );
    });
    it("can't reveal users if user has `revealed_at`", () => {
      assert.deepStrictEqual(
        shouldReveal(
          {
            reveal_segments: ["1"]
          },
          {
            segments: [{ id: "1" }],
            user: {
              id: "1234",
              last_known_ip: "1.2.3.4",
              email: "foo@bar.com",
              "traits_clearbit/revealed_at": "1234"
            }
          }
        ),
        {
          should: false,
          message: "revealed_at present"
        }
      );
    });
  });
});
