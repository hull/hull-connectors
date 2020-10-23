// @flow

import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";

const userUpdate = async (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse => {
  const { connector, client } = ctx;
  const { private_settings = {} } = connector;
  await Promise.all(
    messages.map(message => {
      console.log(private_settings, message);
      client.asUser(message.user).logger.info("outgoing.user.success");
      return true;
    })
  );
};

export default userUpdate;
