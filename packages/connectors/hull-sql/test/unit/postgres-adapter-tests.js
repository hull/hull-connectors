/* global describe, it */
import { expect } from "chai";
import moment from "moment";
import Pg from "pg";

import * as postgresAdapter from "../../server/lib/adapters/postgres";

describe("Postgres Adapter", () => {
  it("should replace import_start_date in query", () => {
    const wrappedQuery = postgresAdapter.wrapQuery("SELECT :import_start_date", {
      import_start_date: moment().format()
    });

    expect(wrappedQuery).to.be.equal(`WITH __qry__ AS (SELECT '${moment().format()}') SELECT * FROM __qry__`);
  });

  // Testing to make sure that the type parsers were associated correctly
  // and are parsing properly
  it("should have set type handlers for postgres types", () => {
    // Testing float parser for 1700 and 1231 the postgres oids for numeric type
    const numericParseFunction = Pg.types.getTypeParser(1700, "text");
    expect(numericParseFunction.name).to.be.equal("parseIncomingFloat");
    expect(numericParseFunction("8.66")).to.be.equal(8.66);

    const numericParseFunction2 = Pg.types.getTypeParser(1231, "text");
    expect(numericParseFunction2.name).to.be.equal("parseIncomingFloat");
    expect(numericParseFunction2("8.66")).to.be.equal(8.66);

    // Testing int parser for 20 and 1016 the postgres oids for integer type
    const intParseFunction = Pg.types.getTypeParser(20, "text");
    expect(intParseFunction.name).to.be.equal("parseIncomingInt");
    expect(intParseFunction("8")).to.be.equal(8);
    expect(intParseFunction("8.66")).to.be.equal(8);

    const intParseFunction2 = Pg.types.getTypeParser(1016, "text");
    expect(intParseFunction2.name).to.be.equal("parseIncomingInt");
    expect(intParseFunction2("8")).to.be.equal(8);
    expect(intParseFunction2("8.66")).to.be.equal(8);

    // Testing default parser which does not parse anything, and just returns the string representation
    const defaultParse = Pg.types.getTypeParser(999, "text");
    expect(defaultParse.name).to.be.equal("noParse");
    expect(defaultParse("8")).to.be.equal("8");
    expect(defaultParse("8.66")).to.be.equal("8.66");
  });
});

