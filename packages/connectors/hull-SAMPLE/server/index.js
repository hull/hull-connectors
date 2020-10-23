// @flow

import { destinationConnector } from "hull";
import manifest from "../manifest.json";

destinationConnector({
  manifest,
  handlers: {
    subscriptions: { userUpdate: () => {} },
    statuses: { statusUpdate: () => {} }
  }
});
