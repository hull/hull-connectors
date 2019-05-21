// @flow
import type { HullContext, HullNotificationResponse } from "hull";
import type { ConnectSlackFunction } from "../types";

const update = (connectSlack: ConnectSlackFunction) => async (
  ctx: HullContext
): HullNotificationResponse => {
  await connectSlack(ctx);
  return {
    flow_control: {
      type: "next",
      size: 1,
      in: 0.1,
      inTime: 0.1
    }
  };
};
export default update;
