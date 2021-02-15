// @flow
import _ from "lodash";
import type { HullContext, HullUserUpdateMessage } from "hull";

const shouldSkip = (ctx: HullContext, message: HullUserUpdateMessage) => {
  const { connector, isBatch } = ctx;
  const { private_settings } = connector;

  // Custom properties to be synchronized
  const {
    synchronized_properties = [],
    synchronized_segments = [],
    synchronized_account_properties = []
  } = private_settings;

  const { segment_ids, changes = {} } = message;
  const {
    user: changedUserAttributes = {},
    account: changedAccountAttributes = {}
  } = changes;

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
    return "not matching any segment";
  }

  /**
   * isBatch is a special boolean which is set on BATCH notifications
   * for batch notifications we do NOT want to filter, which is why it is used
   * in this case to bypass all the segment filtering
   */
  if (
    _.isEmpty(changes.segments) &&
    _.isEmpty(changes.account_segments) &&
    _.intersection(synchronized_properties, changedUserAttributes).length ===
      0 &&
    _.intersection(synchronized_account_properties, changedAccountAttributes)
      .length === 0
  ) {
    // Filter if no interesting changes.
    return "No changes detected that would require a synchronization to segment.com";
  }
  return false;
};
export default shouldSkip;
