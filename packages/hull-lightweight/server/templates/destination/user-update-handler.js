// @flow

import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";

type HandlerFunc = (HullContext, HullUserUpdateMessage) => any;

const update = (handler: HandlerFunc) => async (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): Promise<HullNotificationResponse> => {
  const { client } = ctx;
  try {
    await Promise.all(
      messages.map(async message => {
        const asUser = client.asUser(message.user);
        try {
          const response = await handler(ctx, message);
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
