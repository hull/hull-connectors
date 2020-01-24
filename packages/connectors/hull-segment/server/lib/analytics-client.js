// @flow

import Analytics from "analytics-node";
import type { SegmentClient } from "../types";

module.exports = function analyticsClient(write_key: string): SegmentClient {
  // Stop storing references -> avoid memory leaks
  const opts = process.env.NODE_ENV === "test" ? { flushAt: 1 } : {};
  return new Analytics(write_key, opts);
  // const a = analytics[write_key];
  // if (!a) analytics[write_key] = new Analytics(write_key);
  // return analytics[write_key];
};
