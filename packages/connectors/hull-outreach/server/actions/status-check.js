/* @flow */
import type { $Response } from "express";
import type { THullRequest } from "hull";

const _ = require("lodash");
const SyncAgent = require("../lib/sync-agent");
const SHARED_MESSAGES = require("../lib/shared-messages");

function statusCheck(req: THullRequest): void {

  const { connector, client } = req;
  let status: string = "ok";
  const messages: Array<string> = [];

  if (_.has(req, "connector.private_settings")) {
    const syncAgent = new SyncAgent(req);

    // changing this to an else if block so that we don't bombard the customers with different messages
    // want to be clear with them the thing they need to do next
    if (syncAgent.hasAuthenticationToken() === false) {
      status = "error";
      messages.push(SHARED_MESSAGES.STATUS_NO_ACCESS_TOKEN_FOUND().message);
    } else if (
      _.isEmpty(
        _.get(connector, "private_settings.synchronized_account_segments", [])
      ) &&
      _.isEmpty(
        _.get(connector, "private_settings.synchronized_user_segments", [])
      )
    ) {
      status = "warning";
      messages.push(SHARED_MESSAGES.STATUS_WARNING_NOSEGMENTS().message);
    }

  } else {
    status = "error";
    messages.push(SHARED_MESSAGES.STATUS_CONNECTOR_MIDDLEWARE_MISCONFIGURED().message);
  }

  return client.put(`${connector.id}/status`, { status, messages })
  .then(() => { status, messages });
}

module.exports = statusCheck;
