import type { OutreachWebhookPayload, OutreachWebhookData } from "../lib/types";

const debug = require("debug")("hull-outreach:webhook");
const _ = require("lodash");

function webhook(req) {
  debug("Got Webhook req: " + req);

  return { status: "all good!" };
}

module.exports = webhook;
