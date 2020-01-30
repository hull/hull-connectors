/* global describe, it */
const { expect, should } = require("chai");

const { group, normalize } = require("../../src/utils/traits");
const { user } = require("../fixtures");
should();

const grouped_expected = {
  id: "562123b470df84b740000042",
  address_city: "Hull",
  address_country: "United Kingdom",
  address_state: "England",
  array: ["a", "b"],
  integer: 216,
  created_at: "2015-10-07T12:39:29Z",
  0: null,
  foo: "bar",
  computed: {
    custom: {
      processed: true
    }
  },
  datanyze: {
    country: "France"
  }
};


describe("Traits", () => {
  describe("Traits Grouping", () => {
    it("should be properly formatted", () => {
      const grouped = group(user);
      // expect(grouped.traits).to.be.a("object");
      expect(grouped).to.not.be.a("array");
      expect(grouped).to.deep.equal(grouped_expected);
    });
  });
});
