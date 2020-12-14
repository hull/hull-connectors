// @flow

import type {
  HullContext,
  HullNotificationResponse,
  HullUserUpdateMessage
} from "hull";
import SyncAgent from "../lib/sync-agent";

export default async (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse => {
  try {
    const syncAgent = new SyncAgent(ctx);

    if (!syncAgent.isConfigured()) {
      ctx.client.logger.error("connector.configuration.error", {
        errors: "connector is not configured"
      });
      return Promise.resolve();
    }

    try {
      await Promise.resolve(syncAgent.fetchVisitors(messages));
      // eslint-disable-next-line no-empty
    } catch (error) {}

    return syncAgent.sendUserUpdateMessages(messages);
  } catch (err) {
    return {
      flow_control: { type: "retry" }
    };
  }
};
