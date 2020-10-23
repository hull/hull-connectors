// @flow

import { destinationConnector } from "hull";

// @FlowFixMe
import manifest from "../manifest.json";
import userUpdate from "./user-update";
import statusUpdate from "./status-update";

destinationConnector({
  manifest,
  handlers: {
    subscriptions: { userUpdate },
    statuses: { statusUpdate }
  }
});
