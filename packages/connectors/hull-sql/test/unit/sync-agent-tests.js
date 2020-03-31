/* global describe, it */
import { expect } from "chai";
import sinon from "sinon";
import moment from "moment";
import stream from "stream";

import SyncAgent from "../../server/lib/sync-agent.js";

describe("SyncAgent", () => {
  it("should pass import_start_date to adapter", () => {
    const syncAgent = new SyncAgent({
      ship: {
        private_settings: {
          db_type: "filesystem",
          import_days: 10
        }
      }
    });
    sinon.stub(syncAgent.adapter.in, "runQuery").callsFake(() => {
      return Promise.resolve({ columns: [] });
    });

    const wrapQueryStub = sinon.spy(syncAgent.adapter.in, "wrapQuery");
    syncAgent.runQuery("SELECT email, external_id as id FROM users;");

    expect(wrapQueryStub.args[0][1].import_start_date).to.be.equal(moment().subtract(10, "days").format());
  });

  it("should reject sync operation when stream error occurs", (done) => {
    const syncAgent = new SyncAgent({
      client: {
        logger: {
          error: () => {},
          info: () => {}
        },
        post: () => Promise.resolve({})
      },
      ship: {
        private_settings: {
          db_type: "filesystem",
          import_days: 10
        }
      }
    });
    const mockStream = new stream.Readable();
    mockStream.close = () => {};

    const closeStreamStub = sinon.stub(mockStream, "close");
    const closeConnectionStub = sinon.stub(syncAgent.adapter.in, "closeConnection");

    syncAgent.sync(mockStream, new Date())
      .catch(err => {
        expect(err.message).to.be.equal("Expected");
        done();
      });

    mockStream.emit("error", new Error("Expected"));
    expect(closeStreamStub.callCount).to.be.equal(1);
    expect(closeConnectionStub.callCount).to.be.equal(1);
  });

  it("not fail when undefined stream error occurs", (done) => {
    const syncAgent = new SyncAgent({
      client: {
        logger: {
          error: () => {},
          info: () => {}
        },
        post: () => Promise.resolve({})
      },
      ship: {
        private_settings: {
          db_type: "filesystem",
          import_days: 10
        }
      }
    });
    const mockStream = new stream.Readable();
    mockStream.close = () => {};

    const closeStreamStub = sinon.stub(mockStream, "close");

    syncAgent.sync(mockStream, new Date())
      .catch((err) => {
        expect(err).to.be.equal(undefined);
        done();
      });

    mockStream.emit("error", undefined);
    expect(closeStreamStub.callCount).to.be.equal(1);
  });

  it("snowflake initialization tests", (done) => {
    const initializationParameters = {
      client: {
        logger: {
          error: () => {},
          info: () => {}
        },
        post: () => Promise.resolve({})
      },
      ship: {
        private_settings: {
          db_type: "snowflake",
          import_days: 10
        }
      }
    };
    const emptySyncAgent = new SyncAgent(initializationParameters);
    expect(emptySyncAgent.areConnectionParametersConfigured()).to.be.equal(false);

    initializationParameters.ship.private_settings = {
      db_type: "snowflake",
      db_account: "ab12345.us-east-1",
      db_region: "us-east-1",
      db_user: "tim",
      db_password: "somepass",
      db_name: "test",
      import_days: 10
    };
    const badSyncAgent = new SyncAgent(initializationParameters);
    expect(badSyncAgent.areConnectionParametersConfigured()).to.be.equal(false);

    initializationParameters.ship.private_settings.db_account = "ab12345";
    const goodSyncAgent = new SyncAgent(initializationParameters);
    expect(goodSyncAgent.areConnectionParametersConfigured()).to.be.equal(true);


    done();
  });

  it("postgres initialization tests", (done) => {
    const initializationParameters = {
      client: {
        logger: {
          error: () => {},
          info: () => {}
        },
        post: () => Promise.resolve({})
      },
      ship: {
        private_settings: {
          db_type: "postgres",
          import_days: 10
        }
      }
    };
    const emptySyncAgent = new SyncAgent(initializationParameters);
    expect(emptySyncAgent.areConnectionParametersConfigured()).to.be.equal(false);

    initializationParameters.ship.private_settings = {
      db_type: "postgres",
      db_host: "somehost.com",
      db_port: "5432",
      db_user: "tim",
      db_name: "test",
      import_days: 10
    };
    const badSyncAgent = new SyncAgent(initializationParameters);
    expect(badSyncAgent.areConnectionParametersConfigured()).to.be.equal(false);

    initializationParameters.ship.private_settings.db_password = "somepass";
    const goodSyncAgent = new SyncAgent(initializationParameters);
    expect(goodSyncAgent.areConnectionParametersConfigured()).to.be.equal(true);


    done();
  });

  describe("idKey", () => {
    it("should return 'userId'", () => {
      const syncAgent = new SyncAgent({ ship: { private_settings:
        { db_type: "filesystem", import_type: "users" } } });
      expect(syncAgent.idKey()).to.equal("userId");
    });

    it("should return 'accountId'", () => {
      const syncAgent = new SyncAgent({ ship: { private_settings:
        { db_type: "filesystem", import_type: "accounts" } } });
      expect(syncAgent.idKey()).to.equal("accountId");
    });

    it("should return 'userId'", () => {
      const syncAgent = new SyncAgent({ ship: { private_settings:
        { db_type: "filesystem", import_type: "events" } } });
      expect(syncAgent.idKey()).to.equal("userId");
    });
  });

  describe("dataKey", () => {
    it("should return 'traits'", () => {
      const syncAgent = new SyncAgent({ ship: { private_settings:
        { db_type: "filesystem", import_type: "users" } } });
      expect(syncAgent.dataKey()).to.equal("traits");
    });

    it("should return 'traits'", () => {
      const syncAgent = new SyncAgent({ ship: { private_settings:
        { db_type: "filesystem", import_type: "accounts" } } });
      expect(syncAgent.dataKey()).to.equal("traits");
    });

    it("should return 'properties'", () => {
      const syncAgent = new SyncAgent({ ship: { private_settings:
        { db_type: "filesystem", import_type: "events" } } });
      expect(syncAgent.dataKey()).to.equal("properties");
    });
  });

  describe("getQuery", () => {
    it("should trim semicolon at the end of the string", () => {
      const syncAgent = new SyncAgent({ ship: { private_settings:
        { db_type: "filesystem", query: "SELECT * FROM users;" } } });
      expect(syncAgent.getQuery()).to.equal("SELECT * FROM users");
    });

    it("should trim multiple semicolons at the end of the string", () => {
      const syncAgent = new SyncAgent({ ship: { private_settings:
        { db_type: "filesystem", query: "SELECT * FROM users;;;;" } } });
      expect(syncAgent.getQuery()).to.equal("SELECT * FROM users");
    });

    it("should not remove semicolons from everything than end", () => {
      const syncAgent = new SyncAgent({ ship: { private_settings:
        { db_type: "filesystem", query: ";SELECT; *; FROM; users;p;;" } } });
      expect(syncAgent.getQuery()).to.equal(";SELECT; *; FROM; users;p");
    });
  });
});
