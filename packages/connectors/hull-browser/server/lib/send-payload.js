// @flow

import _ from "lodash";
import type { SendPayloadArgs } from "../../types";

export default function sendUpdateFactory({ io }: any) {
  return function sendPayload({
    client,
    namespace,
    rooms,
    payload
  }: SendPayloadArgs) {
    client.logger.info("outgoing.user.start", { rooms, payload });

    if (payload.message !== "ok") {
      return client.logger.info("outgoing.user.skip", { rooms, payload });
    }

    if (!_.size(rooms)) {
      return client.logger.info("outgoing.user.error", { message: "no rooms" });
    }

    // Send the update to every identifiable id for this user.
    client.logger.info("outgoing.user.send", { rooms, payload });
    _.map(rooms, id =>
      io
        .of(namespace)
        .in(id)
        .emit("user.update", payload)
    );
    return client.logger.info("outgoing.user.success", { rooms, payload });
  };
}
