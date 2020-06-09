// @flow
import type { HullHandlersConfiguration } from "hull";
import userUpdate from "./user-update";
// import accountUpdate from "./account-update";
import statusUpdate from "./status-handler";
import incomingHandler from "./incoming-handler";
import credentialsHandler from "./credentials";
import connectHandler from "./connect";

export default function handler({
  flow_size,
  flow_in
}: {
  flow_size: string | number,
  flow_in: string | number
}): HullHandlersConfiguration {
  return {
    subscriptions: {
      userUpdate: userUpdate({ flow_in, flow_size })
      // Can't rely on AccountUpdate since we don't have a UserID available
      // accountUpdate: accountUpdate({ flow_in, flow_size })
    },
    json: {
      credentialsHandler,
      connectHandler
    },
    incoming: { incomingHandler },
    statuses: { statusUpdate }
  };
}
