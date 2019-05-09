// @flow
import type { HullContext, HullNotificationResponse } from "hull";
import type { ConnectSlackParams } from "../types";

const update = (connectSlack: ConnectSlackParams => any) => async (
  ctx: HullContext
): HullNotificationResponse => {
  const { client, connector } = ctx;
  await connectSlack({ hull: client, connector, force: true });
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
