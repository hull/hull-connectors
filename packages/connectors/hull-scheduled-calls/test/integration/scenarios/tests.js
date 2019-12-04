// @flow

import testScenario from "hull-connector-framework/src/test-scenario";
import _ from "lodash";
import { encrypt } from "hull/src/utils/crypto";
import connectorConfig from "../../../server/config";
import TESTS from "../../tests";

const shipID = "9993743b22d60dd829001999";
const config = {
  organization: "localhost:8001",
  ship: shipID,
  secret: "1234"
};

process.env.MONGO_URL = "mongodb://localhost/scheduled-call-test-db";
process.env.MONGO_COLLECTION_NAME = "scheduled-calls-tests";

TESTS.map(function performTest({
  title,
  body,
  code,
  logs,
  metrics,
  platformApiCalls,
  firehoseEvents
}) {
});
