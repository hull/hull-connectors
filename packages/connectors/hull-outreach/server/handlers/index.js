// @flow
import type { HullHandlersConfiguration, Connector } from "hull";
// import ship_update from "./ship-update";
// import users_segment_update from "./users-segment-update";
// import accounts_segment_update from "./accounts-segment-update";

import adminHandler from "../actions/admin-handler";
import accountFetchAll from "../actions/account-fetch-all";
import prospectFetchAll from "../actions/prospect-fetch-all";
import webhooks from "../actions/webhooks";
import fetchAll from "../actions/fetch-all";
import {
  fieldsOutreachProspectInbound,
  fieldsOutreachProspectOutbound,
  fieldsOutreachAccountOutbound,
  fieldsOutreachAccountInbound,
  fieldsHullAccountIdent,
  fieldsOutreachAccountIdent
} from "../actions";
import HullRouter from "../shared/router";
import user_update from "./user-update";
import account_update from "./account-update";
import status from "../actions/status";

// authHandler &&
//   routers.push();

const handlers = ({ clientID, clientSecret}: {
  clientID: string,
  clientSecret: string
}) => (connector: Connector):HullHandlersConfiguration => {

  const hullRouter: HullRouter = new HullRouter({
    clientID, clientSecret
  });
  const userUpdate = user_update(hullRouter);
  const accountUpdate = account_update(hullRouter);
  const authHandler = hullRouter.createAuthHandler();

  /**
  * We should think more about how the rules get hooked into routes
  * would be cool if this could happen automatically depending on the endpoints you've implemented
  * it's an abstraction for automically routing messages depending on what they "mean"
  */
  const notifications = [
    {
      url: "/smart-notifier",
      handlers: {
        "user:update": {
          callback: userUpdate
        },
        "account:update": {
          callback: accountUpdate
        }
      }
    }
  ];
  const schedules = [
    {
      url: "/status",
      handler: {
        callback: status(hullRouter),
        options: {}
      }
    }
  ];
  const batchHandlers = {
    "user:update": {
      callback: userUpdate
    },
    "account:update": {
      callback: accountUpdate
    }
  };
  const batches = [
    {
      url: "/batch",
      handlers: batchHandlers
    },
    {
      url: "/batch-accounts",
      handlers: batchHandlers
    }
  ];
  const json = [
    {
      url: "/fetch",
      handler: {
        callback: fetchAll(hullRouter),
        options: {
          fireAndForget: true
        }
      }
    },
    {
      url: "/accountFetchAll",
      handler: {
        callback: accountFetchAll(hullRouter),
        options: {
          fireAndForget: true
        }
      }
    },
    {
      url: "/prospectFetchAll",
      handler: {
        callback: prospectFetchAll(hullRouter),
        options: {
          fireAndForget: true
        }
      }
    },
    {
      url: "/fields-outreach-prospect-out",
      handler: {
        callback: fieldsOutreachProspectOutbound,
        options: {
          fireAndForget: true
        }
      }
    },
    {
      url: "/fields-outreach-prospect-in",
      handler: {
        callback: fieldsOutreachProspectInbound
      }
    },
    {
      url: "/fields-outreach-account-in",
      handler: {
        callback: fieldsOutreachAccountInbound
      }
    },
    {
      url: "/fields-outreach-account-out",
      handler: {
        callback: fieldsOutreachAccountOutbound
      }
    }
  ];
  const incoming = [
    {
      url: "/webhooks",
      handler: {
        callback: webhooks(hullRouter),
        options: {
          parseCredentialsFromQuery: true,
          bodyParser: "json"
        }
      }
    }
  ];
  const html = [
    {
      url: "/admin",
      method: "get",
      handler: {
        callback: adminHandler
      }
    }
  ];
  const routers = authHandler
  ? [
    {
      url: "/auth",
      handler: authHandler
    }
  ]
  : [];
  return {
    incoming,
    schedules,
    notifications,
    batches,
    json,
    html,
    routers
  };
}


export default handlers;
