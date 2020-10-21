// @flow
import type { HullHandlersConfiguration } from "hull";
import sync from "../actions/sync";
import admin from "../actions/admin";
import status from "../actions/status";
import run from "../actions/run";
import storedquery from "../actions/storedquery";
import importResults from "../actions/import-results";
import startImport from "../jobs/start-import";
import startSync from "../jobs/start-sync";

const handler = (): HullHandlersConfiguration => {
  return {
    jobs: {
      startImport,
      startSync
    },
    incoming: {},
    subscriptions: {},
    batches: {},
    statuses: {
      status
    },
    schedules: {
      sync
    },
    json: {
      run,
      importResults,
      storedquery
    },
    tabs: {
      admin
    }
  };
};

export default handler;
