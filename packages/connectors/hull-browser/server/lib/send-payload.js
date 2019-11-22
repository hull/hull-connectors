// @flow

import _ from "lodash";
import type { HullContext, HullUserUpdateMessage, HullFetchedUser } from "hull";
import userPayload from "./user-payload";
import getRooms from "./get-rooms";

export default function sendUpdateFactory({ io }: any) {
  return function sendPayload(
    ctx: HullContext,
    message: HullUserUpdateMessage | HullFetchedUser,
    socket
  ) {
    const { clientCredentials, client } = ctx;
    const { id: namespace } = clientCredentials;
    const { user } = message;
    const rooms = getRooms(user);
    const payload = userPayload(ctx, message);
    client.logger.info("outgoing.user.start", { rooms, payload });

    if (payload.message !== "ok") {
      return client.logger.debug("outgoing.user.skip", { rooms, payload });
    }

    if (!_.size(rooms)) {
      return client.logger.info("outgoing.user.error", { message: "no rooms" });
    }

    // Send the update to every identifiable id for this user.
    client.logger.info("outgoing.user.send", { rooms, payload });
    if (socket) {
      socket.emit("user.update", payload);
    } else {
      _.map(rooms, id =>
        io
          .of(namespace)
          .in(id)
          .emit("user.update", payload)
      );
    }
    return client.logger.info("outgoing.user.success", { rooms, payload });
  };
}
