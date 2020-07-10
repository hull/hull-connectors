// @flow
import type { HullHandlersConfiguration } from "hull";

import userUpdate from "./user-update";
import status from "../actions/status";
import refetchDomainInfo from "../jobs/refetch-domain-info";
import admin from "../actions/admin";

const handler = (): HullHandlersConfiguration => {
  return {
    subscriptions: {
      userUpdate
    },
    jobs: {
      refetchDomainInfo
    },
    private_settings: {},
    tabs: {
      admin
    },
    batches: { userUpdate },
    statuses: { status },
    schedules: {}
  };
};

export default handler;
