// @flow

import type { HullContext, HullUserUpdateMessage, HullNotificationResponse } from "hull";
import type { Store, SendPayloadArgs } from "../../types";

import userPayload from "../lib/user-payload";
import getRooms from "../lib/get-rooms";

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
    connectorUpdate(context);
    const { connector, client } = context;
    await Promise.all(
      messages.map(async ({ events, user, segments, account, account_segments }) => {
        const { logger } = client.asUser(user);
        try {
          const namespace = connector.id;
          // Refresh LRU cache;
          await lru(namespace).set(user.id, { user, account, segments });
          sendPayload({
            payload: userPayload({
              user,
              events,
              segments,
              account,
              account_segments,
              connector,
              client
            }),
            rooms: getRooms(user),
            client,
            namespace
          });
        } catch (error) {
          logger.error("outgoing.user.error", { error });
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
    }
  };
}
