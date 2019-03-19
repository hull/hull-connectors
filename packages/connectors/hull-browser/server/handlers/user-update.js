// @flow

import type { HullContext, HullUserUpdateMessage } from "hull";
import type { Store, SendPayloadArgs } from "../../types";

import userPayload from "../lib/user-payload";
import getRooms from "../lib/get-rooms";

export default function factory({
  sendPayload,
  store
}: {
  sendPayload: SendPayloadArgs => void,
  store: Store
}) {
  const { /* get,  */ lru } = store;
  return async function handle(
    { connector, client }: HullContext,
    { events, user, segments, account, account_segments }: HullUserUpdateMessage
  ) {
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
  };
}
