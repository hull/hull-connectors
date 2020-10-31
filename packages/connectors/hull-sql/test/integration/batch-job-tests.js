/* eslint-env node, mocha */

import { encrypt } from "hull/src/utils/crypto";
import connectorConfig from "../../server/config";
import manifest from "../../manifest.json";

const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";
process.env.SERVER = true;

describe("Batch SQL import jobs", () => {
  const connector = {
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

  it("Import Query Test", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.jsonHandler,
        handlerUrl: "import",
        externalIncomingRequest: async ({
            superagent,
            connectorUrl,
            config,
            plainCredentials
          }) => {
          const token = encrypt(plainCredentials, config.hostSecret);
          try {
            return await superagent
              .post(`${connectorUrl}/import/${token}`)
          } catch (err) {
            console.log(err);
            throw err;
          }
        },
        connector,
        usersSegments: [],
        accountsSegments: [],
        response: "scheduled",
        logs: [],
        firehoseEvents: [],
        metrics: [["increment", "connector.request", 1,],],
        platformApiCalls: [
          ["GET", "/api/v1/app", {}, {}],
          ["GET", "/api/v1/users_segments?shipId=9993743b22d60dd829001999", { "shipId": "9993743b22d60dd829001999" }, {}],
          ["GET", "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999", { "shipId": "9993743b22d60dd829001999" }, {}]
        ]
      };
    });
  });
});
