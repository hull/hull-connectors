//@flow

import _ from "lodash";

import type {
  HullContext,
  HullUserUpdateMessage,
  HullAccountUpdateMessage,
  HullNotificationResponse
} from "hull";
import type { SegmentConnector } from "../types";

module.exports = (
  ctx: HullContext<SegmentConnector>,
  actions: Array<HullNotificationResponse>
) => {
  _.map(_.groupBy(_.compact(actions), "action"), (responses, action) => {
    ctx.client.logger.info(`outgoing.account.${action}`, {
      messages: _.pick(responses, "id", "message")
    });
  });
};
