// @flow
import type { HullHandlersConfiguration } from "hull";
// import account_update from "./account-update";
import user_update from "./user-update";
import ship_update from "./ship-update";
import users_segment_update from "./users-segment-update";
import users_segment_delete from "./users-segment-delete";
import {
  sync,
  syncIn,
  syncOut,
  track,
  schemaUserFields,
  status,
  webhook
} from "../actions";

import OAuthFactory from "../lib/oauth-client";

export default function handlers({
  clientID,
  clientSecret,
  hostSecret
}: {
  clientID: string,
  clientSecret: string,
  hostSecret: string
}): HullHandlersConfiguration {
  return {
    incoming: { webhook },
    subscriptions: {
      user_update,
      ship_update,
      users_segment_update,
      users_segment_delete
    },
    batches: { user_update },
    statuses: { status },
    schedules: { track },
    json: {
      schemaUserFields,
      syncIn,
      syncOut,
      sync,
      // @TODO : this is used both as a schedule and as a JSON call
      // Check that both work - the Schedules pass things in the body - the JSON don't
      track
    },
    // @TODO: Check we're still working when using the oauth provider as a classic route
    tabs: {
      auth: OAuthFactory({
        hostSecret,
        clientID,
        clientSecret
      })
    }
  };
}
