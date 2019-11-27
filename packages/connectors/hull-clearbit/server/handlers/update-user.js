// @flow
import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";
import userUpdateLogic from "../lib/user-update-logic";

const updateAccount = ({
  flow_size,
  flow_in
}: {
  flow_size: number,
  flow_in: number
}) => async (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse => {
  try {
    const updateLogic = userUpdateLogic(ctx);
    const actions = await Promise.all(messages.map(updateLogic));
    ctx.client.logger.info("outgoing.user.info", { actions });
    return {
      type: "next",
      size: flow_size,
      in: flow_in
    };
  } catch (error) {
    ctx.client.logger.error("outgoing.user.error", { error });
    return {
      type: "retry",
      size: flow_size,
      in: flow_in
    };
  }
};
export default updateAccount;
