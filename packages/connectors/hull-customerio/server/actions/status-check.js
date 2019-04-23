/* @flow */
import type { HullContext } from "hull";

const _ = require("lodash");
const SyncAgent = require("../lib/sync-agent");

function statusCheckAction(ctx: HullContext): Promise<*> {
  const { hullClient } = ctx;
  const connector = _.get(ctx, "connector", null);
  const syncAgent = new SyncAgent(ctx);
  const messages: Array<string> = [];
  let status: string = "ok";
  const promises: Array<Promise<*>> = [];

  if (
    _.isEmpty(_.get(connector, "private_settings.synchronized_segments", []))
  ) {
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

  const handleResponse = () => {
    hullClient.logger.debug("connector.status", { status, messages });
    return hullClient.put(`${connector.id}/status`, { status, messages })
      .then(() => {
        return Promise.resolve({ status, messages });
      });
  };

  return Promise.all(promises)
    .catch(err => {
      status = "error";
      messages.push(
        `Error when trying to determine the status: ${_.get(
          err,
          "message",
          "Unknown Exception"
        )}`
      );
    })
    .then(handleResponse);
}

module.exports = statusCheckAction;
