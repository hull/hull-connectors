// @flow
import _ from "lodash";
import type { HullContext, HullUserUpdateMessage } from "hull";

const shouldSkip = (ctx: HullContext, message: HullUserUpdateMessage) => {
  const { connector, isBatch } = ctx;
  const { private_settings } = connector;

  // Custom properties to be synchronized
  const { synchronized_segments = [] } = private_settings;

  const { segments } = message;
  const segment_ids = _.map(segments, "id");

  // Only potentially skip if we are NOT ignoring filters if we ARE ignoring filters, then don't skip ever
  if (isBatch) {
    return false;
  }

  if (
    // check to see if any of the synchronized segments is the catchall "ALL" value
    !_.includes(synchronized_segments, "ALL") &&
    // if this user does not belong to any of the synchronized segments
    !_.intersection(segment_ids, synchronized_segments).length
  ) {
    return {
      reason: "not matching any segment",
      data: {
        segment_ids,
        synchronized_segments
      }
    };
  }

  return false;
};
export default shouldSkip;
