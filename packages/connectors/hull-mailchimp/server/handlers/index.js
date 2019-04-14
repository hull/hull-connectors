// @flow
/* eslint-disable global-require */

// import account_update from "./account-update";
import type { HullHandlersConfiguration } from "hull";
import user_update from "./user-update";
import ship_update from "./ship-update";
import users_segment_update from "./users-segment-update";
import users_segment_delete from "./users-segment-delete";

import webhook from "../actions/webhook";
import sync from "../actions/sync";
import syncIn from "../actions/sync-in";
import syncOut from "../actions/sync-out";
import track from "../actions/track";
import schemaUserFields from "../actions/schema-user-fields";
import status from "../actions/status";

import handleMailchimpBatch from "../jobs/handle-mailchimp-batch";
import importUsers from "../jobs/import-users";
import fetchAllUsers from "../jobs/fetch-all-users";
import syncOutJob from "../jobs/sync-out";
import trackUsers from "../jobs/track-users";
import trackJob from "../jobs/track";
import trackEmailActivites from "../jobs/track-email-activites";

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
    jobs: {
      handleMailchimpBatch,
      importUsers,
      fetchAllUsers,
      syncOut: syncOutJob,
      trackUsers,
      track: trackJob,
      trackEmailActivites
    },
    incoming: { webhook },
    subscriptions: {
      user_update,
      ship_update,
      users_segment_update,
      users_segment_delete
    },
    batches: { user_update },
    statuses: { status },
    schedules: {
      track,
      // @TODO: Check with Michal which handler should go in which section
      // I moved the Sync handler from `json` to `schedules` because the tests seemed to indicate we were hitting it on a schedule
      sync
    },
    json: {
      schemaUserFields,
      syncIn,
      syncOut,
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
