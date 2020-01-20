// @flow
import type { HullContext, HullExternalResponse } from "hull";

const SyncAgent = require("../lib/sync-agent");

async function checkTokenAction(ctx: HullContext): HullExternalResponse {
  const syncAgent = new SyncAgent(ctx);
  let data;
  try {
    data = await syncAgent.checkToken();
  } catch (error) {
    data = "Unable to refresh access token. Please manually reauthenticate.";
  }
  return {
    status: 200,
    data
  };
}

module.exports = checkTokenAction;
