// @flow
import type {
  HullContext,
  HullAccountUpdateMessage,
  HullNotificationResponse
} from "hull";
import accountUpdateLogic from "../lib/account-update-logic";

const updateAccount = ({
  flow_size,
  flow_in
}: {
  flow_size: number,
  flow_in: number
}) => async (
  ctx: HullContext,
  messages: Array<HullAccountUpdateMessage>
): HullNotificationResponse => {
  try {
    const updateLogic = accountUpdateLogic(ctx);
    await Promise.all(messages.map(updateLogic));

    return {
      type: "next",
      size: flow_size,
      in: flow_in
    };
  } catch (err) {
    return {
      type: "retry",
      size: flow_size,
      in: flow_in
    };
  }
};
export default updateAccount;
