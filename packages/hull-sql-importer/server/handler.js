// @flow

import type { HullHandlersConfiguration } from "hull";

import admin from "./actions/admin";
import importResults from "./actions/import-results";
import sync from "./actions/sync";
import status from "./actions/status";
import run from "./actions/run";
import storedquery from "./actions/storedquery";
import startImport from "./jobs/start-import";
import startSync from "./jobs/start-sync";

const handler = (adapter): HullHandlersConfiguration => {
  return {
    jobs: {
      startImport: startImport(adapter),
      startSync: startSync(adapter)
    },
    incoming: {},
    subscriptions: {},
    batches: {},
    statuses: {
      status: status(adapter)
    },
    schedules: {
      sync: sync(adapter)
    },
    json: {
      run: run(adapter),
      importResults: importResults(adapter),
      storedquery: storedquery(adapter)
    },
    tabs: {
      admin: admin(adapter)
    }
  };
};

export default handler;
