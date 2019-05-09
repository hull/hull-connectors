/* @flow */
import type { $Response } from "express";
import type { HullRequest } from "hull";

const _ = require("lodash");
const SyncAgent = require("../lib/sync-agent");

function statusCheckAction(req: HullRequest, res: $Response): Promise<*> {
  if (_.has(req, "connector.private_settings")) {
    const { client, connector } = req;
    const syncAgent = new SyncAgent(req);
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
      if (res && _.isFunction(res.json)) {
        res.json({ status, messages });
      }
      client.logger.debug("connector.status", { status, messages });
      client.put(`${connector.id}/status`, { status, messages });
      return { status, messages };
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

  return new Promise(resolve => {
    if (res && _.isFunction(res.status)) {
      res.status(404).json({ status: 404, messages: ["Connector not found"] });
    }
    resolve();
  });
}

module.exports = statusCheckAction;
