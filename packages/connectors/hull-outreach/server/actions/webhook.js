/* @flow */
import type { HullContext, OutreachWebhookPayload, OutreachWebhookData } from "../lib/types";

const debug = require("debug")("hull-outreach:webhook");
const _ = require("lodash");

const SyncAgent = require("../lib/sync-agent");

function webhook(ctx: HullContext, originalRequest) {

  const webhookPayload = _.get(originalRequest, "body.data");
  if (!_.isEmpty(webhookPayload)) {
    const type = webhookPayload.type;

    if (!_.isEmpty(type)) {
      if (type === 'prospect') {
        const attributes = webhookPayload.attributes;
        const relationships = webhookPayload.relationships;
        if (!_.isEmpty(attributes) || !_.isEmpty(relationships)) {
            const syncAgent = new SyncAgent(ctx);
            const hullUserIdent = syncAgent.mappingUtil.mapOutreachProspectToHullUserIdent(
              webhookPayload
            );
            return syncAgent.saveOutreachProspectToHull(hullUserIdent, webhookPayload )
            .then(() => { return { status: 200, text: "All good saved User!" }; });
        }
      } else if (type === 'account') {
        const attributes = webhookPayload.attributes;
        if (!_.isEmpty(attributes)) {
            const syncAgent = new SyncAgent(ctx);
            const hullAccountIdent = syncAgent.mappingUtil.mapOutreachAccountToHullAccountIdent(
              webhookPayload
            );
            // TODO not displaying error in here when dieing for some reason
            return ctx.client
              .asAccount(hullAccountIdent)
              .traits(
                syncAgent.mappingUtil.mapOutreachAccountToHullAccountAttributes(
                  webhookPayload
                )
              ).then(() => { return { status: 200, text: "All good Saved Account!" }; });
        }
      }
    }
  }

  return Promise.resolve({ status: 200, text: "Nothing done!" });
}

module.exports = webhook;
