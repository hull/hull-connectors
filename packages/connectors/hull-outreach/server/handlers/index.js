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

const handlers = ({
  clientID,
  clientSecret
}: {
  clientID: string,
  clientSecret: string
}) => (connector: Connector): HullHandlersConfiguration => {
  const hullRouter: HullRouter = new HullRouter({
    clientID,
    clientSecret
  });
  const userUpdate = user_update(hullRouter);
  const accountUpdate = account_update(hullRouter);

  /**
   * We should think more about how the rules get hooked into routes
   * would be cool if this could happen automatically depending on the endpoints you've implemented
   * it's an abstraction for automically routing messages depending on what they "mean"
   */
  return {
    incoming: { webhooks: webhooks(hullRouter) },
    tabs: { adminHandler },
    credentials: {
      oauth: hullRouter.createAuthHandler
    }
    statuses: { status: status(hullRouter) },
    subscriptions: { userUpdate, accountUpdate },
    batches: { userUpdate, accountUpdate },
    json: {
      fetchAll: fetchAll(hullRouter),
      accountFetchAll: accountFetchAll(hullRouter),
      prospectFetchAll: prospectFetchAll(hullRouter),
      fieldsOutreachProspectOutbound,
      fieldsOutreachProspectInbound,
      fieldsOutreachAccountInbound,
      fieldsOutreachAccountOutbound
    }
  };
};

export default handlers;
