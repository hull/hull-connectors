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

import oauth from "../lib/oauth-client";

const incoming = [
  {
    url: "/mailchimp",
    handler: {
      callback: webhook,
      options: {
        bodyParser: "urlencoded",
        credentialsFromQuery: true
      }
    }
  }
];
const statuses = [
  {
    url: "/status",
    handler: {
      callback: status
    }
  }
];
const notifications = [
  {
    url: "/smart-notifier",
    handlers: {
      "user:update": {
        callback: user_update
      },
      "ship:update": {
        callback: ship_update
      },
      // TODO: Check that we're properly calling this handler name instead
      // TODO: of segment:update / delete
      "users_segment:update": {
        callback: users_segment_update
      },
      "users_segment:delete": {
        callback: users_segment_delete
      }
    }
  }
];
const batches = [
  {
    url: "/batch",
    handlers: {
      "user:update": {
        callback: user_update,
        options: {
          maxSize: 500
        }
      }
    }
  }
];
const json = [
  {
    url: "/sync",
    handler: {
      callback: sync
    }
  },
  {
    url: "/sync-in",
    handler: {
      callback: syncIn
    }
  },
  {
    url: "/sync-out",
    handler: {
      callback: syncOut
    }
  },
  {
    url: "/track",
    handler: {
      callback: track
    }
  },
  {
    url: "/schema/user_fields",
    handler: {
      callback: schemaUserFields
    }
  }
];

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
    incoming,
    notifications,
    statuses,
    batches,
    json,
    routers: [
      {
        url: "/auth",
        handler: oauth({
          name: "Mailchimp",
          hostSecret,
          clientID,
          clientSecret,
          callbackUrl: "/callback",
          homeUrl: "/",
          selectUrl: "/select",
          syncUrl: "/sync",
          site: "https://login.mailchimp.com",
          tokenPath: "/oauth2/token",
          authorizationPath: "/oauth2/authorize"
        })
      }
    ]
  };
}
