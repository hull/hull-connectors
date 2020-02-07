// @flow

import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";
import type { SegmentConnectorSettings } from "../types";
import handleUserUpdate from "./updaters/user";

import analyticsClient from "../lib/analytics-client";

const userUpdate = ({
  flow_size,
  flow_in
}: {
  flow_size: string | number,
  flow_in: string | number,
  analytics_opts?: {}
}) => async (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse => {
  const { connector, client } = ctx;
  const { settings = {} }: SegmentConnectorSettings = connector;

  const { write_key } = settings;

  const flowNext = {
    flow_control: {
      type: "next",
      size: flow_size,
      in: flow_in,
      in_time: 0
    }
  };

  if (!write_key) {
    return flowNext;
  }

  const analytics = analyticsClient(write_key);

  try {
    const handle = handleUserUpdate(ctx, analytics);
    await Promise.all(messages.map(handle));
  } catch (err) {
    client.logger.error("outgoing.user.error", {
      message: err.message,
      reason: err.reason,
      data: err.data
    });
    return {
      flow_control: {
        type: "retry",
        in: flow_in,
        size: flow_size,
        in_time: 0
      }
    };
  }
  return flowNext;
};

export default userUpdate;
