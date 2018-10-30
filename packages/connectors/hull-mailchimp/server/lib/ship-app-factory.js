// @flow
import type { HullContext } from "hull";

const MailchimpClient = require("./service-client");
const MailchimpAgent = require("./mailchimp-agent");
const SyncAgent = require("./sync-agent");

function shipAppFactory(
  ctx: HullContext
): {
  mailchimpClient: MailchimpClient,
  mailchimpAgent: MailchimpAgent,
  syncAgent: SyncAgent
} {
  const mailchimpClient = new MailchimpClient(ctx);
  const mailchimpAgent = new MailchimpAgent(mailchimpClient, ctx);

  // $FlowFixMe
  ctx.shipApp = {
    mailchimpClient,
    mailchimpAgent
  };

  const syncAgent = new SyncAgent(mailchimpClient, ctx);
  ctx.shipApp.syncAgent = syncAgent;
  return ctx.shipApp;
}

module.exports = shipAppFactory;
