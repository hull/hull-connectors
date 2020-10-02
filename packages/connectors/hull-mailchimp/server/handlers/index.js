// @flow
/* eslint-disable global-require */

import type { HullHandlersConfiguration } from "hull";
import { Strategy } from "passport-mailchimp";
import select_list from "./select-list";
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
import fetchRecentUsers from "../actions/fetch-recent-users";
import importBatch from "../actions/batch/import-batch";
import createEmailBatch from "../actions/batch/create-email-batch";
import createMemberBatch from "../actions/batch/create-member-batch";
import importMemberBatch from "../actions/batch/import-member-batch";
import importEmailBatch from "../actions/batch/import-email-batch";

import handleMailchimpBatch from "../jobs/handle-mailchimp-batch";
import importUsers from "../jobs/import-users";
import fetchAllUsers from "../jobs/fetch-all-users";
import fetchRecentUsersJob from "../jobs/fetch-recent-users-job";
import syncOutJob from "../jobs/sync-out";
import trackUsers from "../jobs/track-users";
import trackEmailActivities from "../jobs/track-email-activites";
import onStatus from "../actions/on-status";
import onAuthorize from "../actions/on-authorize";

// import OAuthFactory from "../lib/oauth-client";

export default function handlers({
  clientID,
  clientSecret,
  _hostSecret
}: {
  clientID: string,
  clientSecret: string,
  _hostSecret: string
}): HullHandlersConfiguration {
  return {
    jobs: {
      handleMailchimpBatch,
      importUsers,
      fetchAllUsers,
      syncOut: syncOutJob,
      trackUsers,
      track,
      trackEmailActivities,
      fetchRecentUsers: fetchRecentUsersJob
    },
    incoming: {
      webhook
    },
    subscriptions: {
      user_update,
      ship_update,
      users_segment_update,
      users_segment_delete
    },
    batches: { user_update },
    statuses: { status },
    schedules: {
      createEmailBatch,
      importEmailBatch,
      importMemberBatch
    },
    json: {
      sync,
      syncIn,
      syncOut,
      track,
      fetchRecentUsers,
      createMemberBatch,
      createEmailBatch,
      importBatch
    },
    private_settings: {
      schemaUserFields,
      selectList: select_list,
      oauth: () => ({
        onAuthorize,
        onStatus,
        Strategy,
        clientID,
        clientSecret
      })
    }
  };
}
