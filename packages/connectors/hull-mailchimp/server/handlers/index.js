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
import syncOut from "../actions/sync-out";
import schemaUserFields from "../actions/schema-user-fields";
import status from "../actions/status";
import fetchAllUsers from "../actions/fetch-all-users";
import importBatch from "../actions/batch/import-batch";
import createEmailBatch from "../actions/batch/create-email-batch";
import createMemberBatch from "../actions/batch/create-member-batch";
import importMemberBatch from "../actions/batch/import-member-batch";
import importEmailBatch from "../actions/batch/import-email-batch";

import importUsers from "../jobs/import-users";
import syncOutJob from "../jobs/sync-out";
import trackUsers from "../jobs/track-users";
import trackEmailActivities from "../jobs/track-email-activites";
import onStatus from "../actions/on-status";
import onAuthorize from "../actions/on-authorize";

export default function handlers({
  clientID,
  clientSecret
}: {
  clientID: string,
  clientSecret: string
}): HullHandlersConfiguration {
  return {
    jobs: {
      importUsers,
      syncOut: syncOutJob,
      trackUsers,
      trackEmailActivities
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
      fetchAllUsers,
      syncOut,
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
