// @flow
import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";
import Clearbit from "../clearbit";
import userUpdateLogic from "../lib/user-update-logic";

const updateAccount = async (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse => {
  const flowControlSize = parseInt(process.env.FLOW_CONTROL_SIZE, 10) || 200;
  const flowControlIn = parseInt(process.env.FLOW_CONTROL_IN, 10) || 100;

  try {
    const clearbit = new Clearbit(ctx);
    const updateLogic = userUpdateLogic(ctx, clearbit);
    await Promise.all(messages.map(message => updateLogic(message)));

    // const ids = _.reduce(
    //   messages,
    //   (memo, { account = {} }) => {
    //     if (account.id) memo.push(account.id);
    //     return memo
    //   },
    //   []
    // );
    //
    // client.logger.info("outgoing.user.start", { ids });
    //
    // if (!ids.length) {
    //   return client.logger.info("outgoing.user.skip", {
    //     ids
    //   });
    // }
    //

    return {
      type: "next",
      size: flowControlSize,
      in: flowControlIn
    };
  } catch (err) {
    return {
      type: "retry",
      size: flowControlSize,
      in: flowControlIn
    };
  }
};
export default updateAccount;
