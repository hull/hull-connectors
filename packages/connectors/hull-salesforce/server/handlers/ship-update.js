// @flow

import type { HullContext } from "hull";
import SyncAgent from "../lib/sync-agent";

export default async (ctx: HullContext) => {
  try {
    return {
      flow_control: { type: "next", size: 10, in_time: 10, in: 5 }
    };
  } catch (err) {
    throw err;
  }
};
