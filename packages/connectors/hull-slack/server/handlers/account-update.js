// @flow
import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";

const update = (connectSlack: ConnectSlackParams => any) => async (
  { client, connector }: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse => {
  const bot = await connectSlack({ hull: client, connector });

  return {
    flow_control: {
      type: "next",
      size: 100,
      in: 0.1
    }
  };
};

export default update;
