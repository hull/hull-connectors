// @flow

import type {
  HullContext,
  HullFetchedUser,
  HullNotificationResponse,
  HullUserUpdateMessage
} from "hull";

import type { Store } from "../../types";

export default function factory({
  connectorUpdate,
  sendPayload,
  store
}: {
  connectorUpdate: (ctx: HullContext) => Promise<void>,
  sendPayload: (HullContext, HullFetchedUser) => void,
  store: Store
}) {
  const { /* get,  */ lru } = store;
  return async function handle(
    ctx: HullContext,
    messages: Array<HullUserUpdateMessage>
  ): HullNotificationResponse {
    const { connector } = ctx;
    await connectorUpdate(ctx);
    await Promise.all(
      messages.map(async message => {
        const { user } = message;
        // Refresh LRU cache;
        // Store the latest message for a given user id in LRU so that we can retrieve it quickly on next page loads
        await lru(connector.id).set(user.id, message);
        // Attempt to send current payload to any websocket-connected client
        sendPayload(ctx, message);
      })
    );
    return {
      flow_control: {
        type: "next",
        in_time: 0,
        size: 100
      }
    };
  };
}
