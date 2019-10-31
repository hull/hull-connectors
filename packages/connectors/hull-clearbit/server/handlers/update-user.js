// @flow
import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";
import _ from "lodash";
// import Clearbit from "../clearbit";
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
  const { client } = ctx;
  try {
    const ids = _.compact(_.map(messages, m => _.get(m, "user.id")));
    if (!ids.length) {
      client.logger.info("outgoing.user.skip", { ids });
    } else {
      const updateLogic = userUpdateLogic(ctx);
      await Promise.all(messages.map(updateLogic));
    }
    return {
      type: "next",
      size: flow_size,
      in: flow_in
    };
  } catch (err) {
    console.log("Error", err);
    return {
      type: "retry",
      size: flow_size,
      in: flow_in
    };
  }
};
export default updateAccount;
