// @flow

import { encrypt } from "hull/src/utils/crypto";

const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";
process.env.SERVER = true;

import connectorConfig from "../../server/config";
import manifest from "../../manifest.json";

const connector = {
  private_settings: {
    db_type: "filesystem",
    db_host: "filesystem",
    query: "test/fixtures/query-data.json",
    db_port: "5433",
    db_name: "hullsql",
    db_user: "hullsql",
    db_password: "hullsql",
    enabled: true
  }
};

it("Run Query Test", () => {
  return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.jsonHandler,
      handlerUrl: "run",
      externalIncomingRequest: async ({
        superagent,
        connectorUrl,
        config,
        plainCredentials
      }) => {
        const token = encrypt(plainCredentials, config.hostSecret);
        try {
          return await superagent
            .post(`${connectorUrl}/run/${token}`)
        } catch (err) {
          console.log(err);
          throw err;
        }
      },
      connector,
      usersSegments: [],
      accountsSegments: [],
      response: {
        "entries": [
          {
            "id": "1",
            "name": "Michael",
            "email": "",
            "external_id": 4
          },
          {
            "id": "2",
            "name": "Anna",
            "email": "",
            "external_id": 5
          },
          {
            "id": "3",
            "name": "Victoria",
            "email": "",
            "external_id": 6
          }
        ]
      },
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
