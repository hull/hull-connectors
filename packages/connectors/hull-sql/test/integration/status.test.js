// @flow

import { encrypt } from "hull/src/utils/crypto";

const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";
process.env.SERVER = true;

import connectorConfig from "../../server/config";

const connector = {
  private_settings: {
    db_type: "filesystem",
    output_type: "filesystem",
    query: "",
    db_port: "5433",
    db_name: "hullsql",
    db_user: "hullsql",
    db_password: "hullsql",
    enabled: true
  }
};

it("should check status", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.scheduleHandler,
      handlerUrl: "status",
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
      response: {"messages": ["Connection parameters are not fully configured"], "status": "setupRequired"},
      logs: [["debug", "connector.statusCheck.start", {}, undefined]],
      firehoseEvents: [],
      metrics: [["increment", "connector.request", 1,],],
      platformApiCalls: [
        ["PUT", "/api/v1/9993743b22d60dd829001999/status", {}, { "messages": ["Connection parameters are not fully configured"], "status": "setupRequired" }
      ]]
    };
  });
});
