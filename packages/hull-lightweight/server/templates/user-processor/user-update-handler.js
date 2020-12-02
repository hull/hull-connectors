// @flow

import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";

type HandlerFunc = any => any;

const update = (handler: HandlerFunc) => async (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): Promise<HullNotificationResponse> => {
  const { connector, client } = ctx;
  const { group } = client.utils.traits;
  const { private_settings } = connector;
  try {
    await Promise.all(
      messages.map(async message => {
        const asUser = client.asUser(message.user);
        try {
          const response = await handler({
            ...message,
            user: group(message.user),
            account: group(message.account),
            private_settings,
            hull: {
              ...client,
              traits: asUser.traits,
              track: asUser.track
            }
          });
          asUser.logger.info("incoming.user.success", { response });
          return true;
        } catch (err) {
          asUser.logger.error("incoming.user.error", { error: err.message });
          throw err;
        }
      })
    );
    return {
      flow_control: {
        type: "next"
      }
    };
  } catch (err) {
    client.logger.error("incoming.user.error", { error: err.message });
    return {
      flow_control: {
        type: "retry"
      }
    };
  }
};

export default update;
