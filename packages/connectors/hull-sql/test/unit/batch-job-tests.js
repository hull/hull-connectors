/* eslint-env node, mocha */

const assert = require("assert");

import _ from "lodash";
import fs from "fs";
import path from "path";
import sinon from "sinon";
import SyncAgent from "../../server/lib/sync-agent";
import ClientMock from "./client-mock";

describe("Batch SQL import jobs", () => {
  const extractsDir = "test/extracts";
  const shipId = "ship-id-1234";
  const ship = {
    id: shipId,
    private_settings: {
      db_type: "filesystem",
      output_type: "filesystem",
      query: "test/fixtures/batch-data-users.json",
      db_host: "localhost",
      db_port: "5433",
      db_name: "hullsql",
      db_user: "hullsql",
      db_password: "hullsql"
    },
  };
  const metric = {
    increment: () => {}
  };


  const job = {};

  beforeEach(() => {
    if (!fs.existsSync(extractsDir)) {
      fs.mkdirSync(extractsDir);
    }
    fs.readdir(extractsDir, (err, files) => {
      for (const file of files) {
        fs.unlink(path.join(extractsDir, file), (e) => {
          console.error(e);
        });
      }
    });
  });

  afterEach(() => {
    metric.increment.restore();
  });

  it("should extract users to file", (done) => {
    const client = ClientMock();
    const agent = new SyncAgent({ ship, client, job, metric, batchSize: 2 });

    const createJob = sinon.spy(client, "post").withArgs("/import/users");
    const updateShip = sinon.spy(client.utils.settings, "update");
    const metricIncrement = sinon.spy(metric, "increment");

    agent.startImport().then(() => {
      // Make sure jobs created
      assert(createJob.calledTwice);
      assert(createJob.parent.firstCall.args[1].name.match(/part 1/));
      assert(createJob.parent.secondCall.args[1].name.match(/part 2/));

      assert(updateShip.calledOnce);

      assert(metricIncrement.calledOnce);
      assert.equal(metricIncrement.firstCall.args[0], "ship.incoming.users");
      assert.equal(metricIncrement.firstCall.args[1], 3);

      return fs.readdirSync(extractsDir);
    }).then((files) => {
      // Make sure files were extracted
      assert.equal(files.length, 2);
      files.forEach(file => assert(_.endsWith(file, "1.json") || _.endsWith(file, "2.json")));
      // Check exported content
      const lines = files.reduce((lines, file) => {
        const data = fs.readFileSync(path.join(extractsDir, file)).toString();
        return lines.concat(data.trim().split("\n").map(JSON.parse));
      }, []);
      assert.equal(lines.length, 3);
      assert.deepEqual(lines, [
        { userId: "1", traits: { name: "Romain", age: 12 } },
        { userId: "2", traits: { name: "Thomas", age: 5 } },
        { userId: "3", accountId: "abcd", traits: { name: "Stephane", age: 8 } }
      ]);
    }).then(done);
  });

  it("should extract accounts to file", (done) => {
    ship.private_settings.import_type = "accounts";
    ship.private_settings.query = "test/fixtures/batch-data-accounts.json";
    const client = ClientMock();
    const agent = new SyncAgent({ ship, client, job, metric, batchSize: 2 });

    const createJob = sinon.spy(client, "post").withArgs("/import/accounts");
    const updateShip = sinon.spy(client.utils.settings, "update");
    const metricIncrement = sinon.spy(metric, "increment");

    agent.startImport().then(() => {
      // Make sure jobs created
      assert(createJob.calledTwice);
      assert(createJob.parent.firstCall.args[1].name.match(/part 1/));
      assert(createJob.parent.secondCall.args[1].name.match(/part 2/));

      assert(updateShip.calledOnce);

      assert(metricIncrement.calledOnce);
      assert.equal(metricIncrement.firstCall.args[0], "ship.incoming.accounts");
      assert.equal(metricIncrement.firstCall.args[1], 3);

      return fs.readdirSync(extractsDir);
    }).then((files) => {
      // Make sure files were extracted
      assert.equal(files.length, 2);
      files.forEach(file => assert(_.endsWith(file, "1.json") || _.endsWith(file, "2.json")));
      // Check exported content
      const lines = files.reduce((lines, file) => {
        const data = fs.readFileSync(path.join(extractsDir, file)).toString();
        return lines.concat(data.trim().split("\n").map(JSON.parse));
      }, []);
      assert.equal(lines.length, 3);
      assert.deepEqual(lines, [
        { accountId: "1", traits: { name: "Hull", age: 12 } },
        { accountId: "2", traits: { name: "Facebook", age: 5 } },
        { accountId: "3", traits: { name: "Clearbit", age: 8 } }
      ]);
    }).then(done);
  });

  it("should extract events to file", (done) => {
    ship.private_settings.import_type = "events";
    ship.private_settings.query = "test/fixtures/batch-data-events.json";
    const client = ClientMock();
    const agent = new SyncAgent({ ship, client, job, metric, batchSize: 2 });

    const createJob = sinon.spy(client, "post").withArgs("/import/events");
    const updateShip = sinon.spy(client.utils.settings, "update");
    const metricIncrement = sinon.spy(metric, "increment");

    agent.startImport().then(() => {
      // Make sure jobs created
      assert(createJob.calledTwice);
      assert(createJob.parent.firstCall.args[1].name.match(/part 1/));
      assert(createJob.parent.secondCall.args[1].name.match(/part 2/));

      assert(updateShip.calledOnce);

      assert(metricIncrement.calledOnce);
      assert.equal(metricIncrement.firstCall.args[0], "ship.incoming.events");
      assert.equal(metricIncrement.firstCall.args[1], 3);

      return fs.readdirSync(extractsDir);
    }).then((files) => {
      // Make sure files were extracted
      assert.equal(files.length, 2);
      files.forEach(file => assert(_.endsWith(file, "1.json") || _.endsWith(file, "2.json")));
      // Check exported content
      const lines = files.reduce((lines, file) => {
        const data = fs.readFileSync(path.join(extractsDir, file)).toString();
        return lines.concat(data.trim().split("\n").map(JSON.parse));
      }, []);
      assert.equal(lines.length, 3);
      assert.deepEqual(lines, [
        { userId: "1", eventId: "1234567890", timestamp: "2017-10-17T17:48:00", event: "click", properties: { foo: "bar" } },
        { userId: "2", eventId: "1234567891", timestamp: "2017-10-17T17:45:00", event: "view", properties: { foo: "bat" } },
        { userId: "1", eventId: "1234567892", timestamp: "2017-10-17T17:40:00", event: "download", properties: { foo: "toto" } }
      ]);
    }).then(done);
  });
});
