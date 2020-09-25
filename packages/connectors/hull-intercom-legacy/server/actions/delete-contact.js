// @flow
import type { HullContext, HullIncomingHandlerMessage } from "hull";

const Promise = require("bluebird");
const _ = require("lodash");

const IntercomClient = require("../lib/intercom-client");
const IntercomAgent = require("../lib/intercom-agent");
const SyncAgent = require("../lib/sync-agent/sync-agent");

function deleteContact(ctx: HullContext, message: HullIncomingHandlerMessage) {
  const intercomClient = new IntercomClient(ctx);
  const intercomAgent = new IntercomAgent(intercomClient, ctx);
  const syncAgent = new SyncAgent(intercomAgent, ctx);

  if (!syncAgent.isConfigured()) {
    ctx.client.logger.error("connector.configuration.error", {
      errors: "connector is not configured"
    });
    return Promise.resolve();
  }

  const id = _.get(message, "body.id", null);

  if (!id) {
    return Promise.resolve({
      status: 422,
      error: "Missing id to delete in Intercom"
    });
  }

  return syncAgent
    .deleteContact(id)
    .then(() => {
      return Promise.resolve({
        status: 200
      });
    })
    .catch(err => {
      return Promise.resolve({
        status: err.statusCode,
        error: err.message
      });
    });
}

module.exports = deleteContact;
