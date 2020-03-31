/* eslint-env node, mocha */

const assert = require("assert");

import fs from "fs";
import SyncAgent from "../../server/lib/sync-agent";
import ClientMock from "./client-mock";

describe("runQuery job", () => {
  const shipId = "ship-id-4321";
  const ship = {
    id: shipId,
    private_settings: {
      db_type: "filesystem",
      output_type: "filesystem"
    },
  };
  const query = "test/fixtures/query-data.json";
  const queryResult = "test/fixtures/query-data-result.json";

  const job = {};

  it("should run the query and return correct result", (done) => {
    const client = ClientMock();
    const agent = new SyncAgent({ ship, client, job });

    agent.runQuery(query).then(result => {
      const data = fs.readFileSync(queryResult, { encoding: "utf8" });

      assert(data.includes(JSON.stringify(result.entries)));
    }).then(done);
  });
});
