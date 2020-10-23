// @flow

import { destinationConnector } from "hull";
import manifest from "../manifest.json";
import userUpdate from "./user-update";

destinationConnector({
  manifest,
  handlers: {
    subscriptions: { userUpdate },
    statuses: { statusUpdate: () => {} }
  }
});
