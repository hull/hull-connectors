import type {
  OutreachWebhookPayload,
  OutreachWebhookData
} from "../lib/types";

const { Batcher } = require("hull/lib/infra");
const _ = require("lodash");

const { saveUsers, saveLeads, saveEvents } = require("./events");

function webhook(req, res, next) {

  req.hull.client.logger.debug("outreach webhook", _.pick(req.body, "data.id", "data.type"));

  const webhookPayload: OutreachWebhookPayload = _.get(req, "body");
  const webhookData: OutreachWebhookData = webhookPayload.data;

  if (webhookData.type === "account") {

    //TODO filter noop accounts

    // map the users to get only mapped fields
    return Batcher.getHandler("webhook", {
      ctx: req.hull,
      options: {
        maxSize: process.env.NOTIFY_BATCH_HANDLER_SIZE || 100,
        maxTime: process.env.NOTIFY_BATCH_HANDLER_THROTTLE || 30000
      }
    })
      .setCallback(users => saveUsers(req.hull, { users }))
      .addMessage(_.get(req, "body.data.item"))
      .then(next, next);
  }

  if (webhookData.type === "prospect") {

    //TODO filter noop prospect

    const lead = _.get(req, "body.data.item");
    return Batcher.getHandler("webhook_leads", {
      ctx: req.hull,
      options: {
        maxSize: process.env.NOTIFY_BATCH_HANDLER_SIZE || 100,
        maxTime: process.env.NOTIFY_BATCH_HANDLER_THROTTLE || 30000
      }
    })
      .setCallback(leads => saveLeads(req.hull, { leads }))
      .addMessage(lead)
      .then(next, next);
  }

  return Batcher.getHandler("webhook_events", {
    ctx: req.hull,
    options: {
      maxSize: process.env.NOTIFY_BATCH_HANDLER_SIZE || 100,
      maxTime: process.env.NOTIFY_BATCH_HANDLER_THROTTLE || 30000
    }
  })
    .setCallback(events => saveEvents(req.hull, { events }))
    .addMessage(_.get(req, "body"))
    .then(next, next);
}

module.exports = webhook;
