/* eslint-env node, mocha */
const moment = require("moment");
const assert = require("assert");
const { expect } = require("chai");
const sinon = require("sinon");

const { getTraitsFrom, isValidIpAddress } = require("../../server/lib/utils");
const revealData = require("./fixtures/reveal.json");

const combined = require("./fixtures/combined.json");

describe("enrich module", () => {
  it("Should return alexa rank from enrich payload", () => {
    const traits = getTraitsFrom(
      combined.company,
      [
        {
          hull: "clearbit/metrics_alexa_global_rank",
          service: "metrics.alexaGlobalRank",
          overwrite: true
        }
      ],
      "Company"
    );
    const rank = combined.company.metrics.alexaGlobalRank;
    assert.equal(rank, 55993);
    assert.equal(traits["clearbit/metrics_alexa_global_rank"], rank);
  });

  it("Should respect setIfNull", () => {
    const traits = getTraitsFrom(
      combined.company,
      [
        {
          hull: "clearbit/metrics_alexa_global_rank",
          service: "metrics.alexaGlobalRank",
          overwrite: false
        }
      ],
      "Company"
    );
    const rank = combined.company.metrics.alexaGlobalRank;
    assert.equal(rank, 55993);
    assert.equal(traits["clearbit/metrics_alexa_global_rank"], {
      value: rank,
      operation: "setIfNull"
    });
  });

  it("Should return employment domain from enrich payload", () => {
    const traits = getTraitsFrom(
      combined.person,
      [
        {
          hull: "clearbit/employment_domain",
          service: "employment.domain",
          overwrite: true
        }
      ],
      "Person"
    );
    const emp_domain = combined.person.employment.domain;
    assert.equal(emp_domain, "calvinklein.us");
    assert.equal(traits["clearbit/employment_domain"], emp_domain);
  });

  it("Should return alexa rank from reveal payload", () => {
    const traits = getTraitsFrom(
      revealData.company,
      [
        {
          hull: "clearbit/metrics_alexa_global_rank",
          service: "metrics.alexaGlobalRank",
          overwrite: true
        }
      ],
      "Company"
    );
    const rank = revealData.company.metrics.alexaGlobalRank;
    assert.equal(rank, 30726);
    assert.equal(traits["clearbit/metrics_alexa_global_rank"], rank);
  });

  it("Should exlude invalid IPs from Reveal", () => {
    assert(isValidIpAddress("1.2.3.4"));

    // Not an IP address
    assert(!isValidIpAddress("0"), "0 is Not a valid IP");
    assert(!isValidIpAddress("a.b.c"), "Not a valid IP");
    assert(!isValidIpAddress("boom"), "Not a valid IP");

    // Google Bot
    assert(!isValidIpAddress("64.233.160.34"), "Google Bot");

    // Private Network
    assert(!isValidIpAddress("192.168.0.1"), "Private Network");
  });
});
