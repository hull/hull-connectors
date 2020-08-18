/* @flow */
import type {
  HullContext,
  HullNotificationResponse,
  HullUserUpdateMessage
} from "hull";

const _ = require("lodash");
const SyncAgent = require("../lib/sync-agent/sync-agent");
const IntercomClient = require("../lib/intercom-client");
const IntercomAgent = require("../lib/intercom-agent");

export default async (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse => {
  try {
    const enrichedMessages = messages.map(m => {
      if (!_.has(m.user, "account")) {
        m.user.account = _.get(m, "account");
      }
      return m;
    });

    const intercomClient = new IntercomClient(ctx);
    const intercomAgent = new IntercomAgent(intercomClient, ctx);
    const syncAgent = new SyncAgent(intercomAgent, ctx);

    if (ctx.notification.is_export) {
      return syncAgent.sendBatch(enrichedMessages);
    }

    await syncAgent.sendUserMessages(enrichedMessages);
    return {};
  } catch (err) {
    ctx.client.logger.info("outgoing.job.error", { error: err });
    return {
      flow_control: { type: "retry" }
    };
  }
};
