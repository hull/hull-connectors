/* @flow */
import type { OutreachWebhookPayload, OutreachWebhookData } from "../lib/types";

const debug = require("debug")("hull-outreach:webhook");
const _ = require("lodash");

function webhook(ctx, originalRequest) {
  const requestBody = originalRequest.body;
  debug(`Got Webhook req: ${JSON.stringify(requestBody)}`);

  return Promise.resolve({ status: 200, text: "All good!" });
}

module.exports = webhook;
