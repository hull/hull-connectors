// @flow
import _ from "lodash";

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
    const actions = await Promise.all(messages.map(updateLogic));
    ctx.client.logger.info("outgoing.account.info", { actions });
    return {
      type: "next",
      size: flow_size,
      in: flow_in
    };
  } catch (error) {
    ctx.client.logger.error("outgoing.account.error", {
      error: _.get(error, "body.error") || error.message || error
    });
    return {
      type: "retry",
      size: flow_size,
      in: flow_in
    };
  }
};
export default updateAccount;
