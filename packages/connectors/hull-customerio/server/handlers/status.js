/* @flow */
import type { HullContext, HullStatusResponse } from "hull";

const _ = require("lodash");
const SyncAgent = require("../lib/sync-agent");

async function statusCheckAction(ctx: HullContext): HullStatusResponse {
  const { connector } = ctx;
  const { private_settings = {} } = connector;
  const { synchronized_segments, site_id, api_key } = private_settings;

  const syncAgent = new SyncAgent(ctx);
  const messages: Array<string> = [];
  let status: string = "ok";
  const promises: Array<Promise<*>> = [];

  if (!site_id || !api_key) {
    return {
      status: "setupRequired",
      messages: ["Please enter your Customer.io Site ID and API Key"]
    };
  }

  if (_.isEmpty(synchronized_segments)) {
    if (status !== "error") {
      status = "warning";
    }
    messages.push(
      "No users will be synchronized because you have not specified at least one whitelisted segment in Settings."
    );
  }

  if (!syncAgent.isConfigured()) {
    status = "warning";
    messages.push(
      "Missing Credentials: Site ID or API Key are not configured in Settings."
    );
  } else {
    promises.push(
      syncAgent
        .checkAuth()
        .then(valid => {
          if (!valid) {
            status = "error";
            messages.push(
              "Invalid Credentials: Verify Site ID and API Key in Settings."
            );
          }
        })
        .catch(err => {
          status = "error";
          messages.push(
            `Error when trying to connect with Customer.io: ${_.get(
              err,
              "message",
              "Unknown Exception"
            )}`
          );
        })
    );
  }

  try {
    await Promise.all(promises);
  } catch (err) {
    status = "error";
    messages.push(
      `Error when trying to determine the status: ${_.get(
        err,
        "message",
        "Unknown Exception"
      )}`
    );
  }
  return {
    status,
    messages
  };
}

module.exports = statusCheckAction;
