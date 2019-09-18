// @flow
import type { HullContext, HullAccountUpdateMessage } from "hull";
import _ from "lodash";
import Clearbit from "../clearbit";
import accountUpdateLogic from "../lib/account-update-logic";

const updateAccount = async (
  ctx: HullContext,
  messages: Array<HullAccountUpdateMessage>
) => {
  const flowControlSize = parseInt(process.env.FLOW_CONTROL_SIZE, 10) || 200;
  const flowControlIn = parseInt(process.env.FLOW_CONTROL_IN, 10) || 100;

  try {
    const { client } = ctx;
    const clearbit = new Clearbit(ctx, { stream });
    const ids = _.compact(_.map(messages, m => _.get(m, "account.id")));

    client.logger.info("outgoing.account.start", { ids });

    if (!ids.length) {
      return client.logger.info("outgoing.account.skip", {
        ids
      });
    }

    await Promise.all(
      messages.map(message => accountUpdateLogic({ message, clearbit, client }))
    );

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
