// @flow
import type { HullHandlersConfiguration } from "hull";

import {
  admin,
  sync,
  status,
  run,
  storedquery,
  importResults,
  startImport,
  startSync
} from "hull-sql";

import { snowflake } from "../lib";

const handler = (): HullHandlersConfiguration => {
  return {
    jobs: {
      startImport: startImport(snowflake),
      startSync: startSync(snowflake)
    },
    incoming: {},
    subscriptions: {},
    batches: {},
    statuses: {
      status: status(snowflake)
    },
    schedules: {
      sync: sync(snowflake)
    },
    json: {
      run: run(snowflake),
      importResults: importResults(snowflake),
      storedquery: storedquery(snowflake)
    },
    tabs: {
      admin: admin(snowflake)
    }
  };
};

export default handler;
