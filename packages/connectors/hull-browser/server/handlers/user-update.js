// @flow

import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";
import type { Store, SendPayloadArgs } from "../../types";

export default function factory({
  connectorUpdate,
  sendPayload,
  store
}: {
  connectorUpdate: (ctx: HullContext) => Promise<void>,
  sendPayload: SendPayloadArgs => void,
  store: Store
}) {
  const { /* get,  */ lru } = store;
  return async function handle(
    context: HullContext,
    messages: Array<HullUserUpdateMessage>
  ): HullNotificationResponse {
    const { connector, client } = context;
    await connectorUpdate(context);
    await Promise.all(
      messages.map(async message => {
        const { user } = message;
        try {
          const namespace = connector.id;
          // Refresh LRU cache;
          // Store the latest message for a given user id in LRU so that we can retrieve it quickly on next page loads
          await lru(namespace).set(user.id, message);
          // Attempt to send current payload to any websocket-connected client
          sendPayload(context, message);
        } catch (error) {
          client.asUser(user).logger.error("outgoing.user.error", { error });
        }
      })
    );
    return {
      flow_control: {
        type: "next",
        in_time: 0.1,
        size: 100,
        in: 100
      }
    };
  };
}
