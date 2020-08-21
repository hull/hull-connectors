// @flow
import type { HullContext, HullIncomingHandlerMessage } from "hull";

const { Batcher } = require("hull/src/infra");
const _ = require("lodash");
const IntercomClient = require("../lib/intercom-client");
const IntercomAgent = require("../lib/intercom-agent");
const SyncAgent = require("../lib/sync-agent/sync-agent");

function webhook(ctx: HullContext, message: HullIncomingHandlerMessage) {
  const intercomClient = new IntercomClient(ctx);
  const intercomAgent = new IntercomAgent(intercomClient, ctx);
  const syncAgent = new SyncAgent(intercomAgent, ctx);

  const private_settings = ctx.connector.private_settings;

  if (_.get(ctx, "connector.accept_incoming_webhooks") === false) {
    return Promise.resolve("Connector is paused, skipping");
  }

  const { id, topic } = _.get(message, "body", {});
  syncAgent.client.logger.debug("intercom message", { id, topic });

  if (topic === "user.created") {
    return Batcher.getHandler("webhook", {
      ctx,
      options: {
        maxSize: process.env.NOTIFY_BATCH_HANDLER_SIZE || 100,
        maxTime: process.env.NOTIFY_BATCH_HANDLER_THROTTLE || 30000
      }
    })
      .setCallback(users => syncAgent.saveUsers(users))
      .addMessage(_.get(message, "body.data.item"));
  }

  if (
    _.get(private_settings, "mark_deleted_users", true) &&
    topic === "user.deleted"
  ) {
    return Batcher.getHandler("webhook", {
      ctx,
      options: {
        maxSize: process.env.NOTIFY_BATCH_HANDLER_SIZE || 100,
        maxTime: process.env.NOTIFY_BATCH_HANDLER_THROTTLE || 30000
      }
    })
      .setCallback(users => {
        users.forEach(u => {
          u.updated_at = _.get(message, "body.created_at");
        });
        return syncAgent.saveUsersDeletion(users);
      })
      .addMessage(_.get(message, "body.data.item"));
  }

  if (topic === "contact.created") {
    const lead = _.get(message, "body.data.item");
    return Batcher.getHandler("webhook_leads", {
      ctx,
      options: {
        maxSize: process.env.NOTIFY_BATCH_HANDLER_SIZE || 100,
        maxTime: process.env.NOTIFY_BATCH_HANDLER_THROTTLE || 30000
      }
    })
      .setCallback(leads => syncAgent.saveLeads(leads, { useFastLane: true }))
      .addMessage(lead);
  }

  if (topic === "contact.signed_up") {
    const lead = _.get(message, "body.data.item");
    return Batcher.getHandler("webhook_contact.signed_up", {
      ctx,
      options: {
        maxSize: process.env.NOTIFY_BATCH_HANDLER_SIZE || 100,
        maxTime: process.env.NOTIFY_BATCH_HANDLER_THROTTLE || 30000
      }
    })
      .setCallback(users => syncAgent.saveUsers(users))
      .addMessage(lead);
  }

  return Batcher.getHandler("webhook_events", {
    ctx,
    options: {
      maxSize: process.env.NOTIFY_BATCH_HANDLER_SIZE || 100,
      maxTime: process.env.NOTIFY_BATCH_HANDLER_THROTTLE || 30000
    }
  })
    .setCallback(events => syncAgent.saveEvents(events || []))
    .addMessage(_.get(message, "body"));
}

module.exports = webhook;
