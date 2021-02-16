// @flow
import _ from "lodash";

export default function hasChanges(ctx, message) {
  const { connector, isBatch } = ctx;
  const { private_settings } = connector;

  // Custom properties to be synchronized
  const {
    synchronized_properties = [],
    synchronized_account_properties = []
  } = private_settings;

  const { changes = {} } = message;
  const { segments, account_segments, user = [], account = [] } = changes;

  /**
   * isBatch is a special boolean which is set on BATCH notifications
   * for batch notifications we do NOT want to filter, which is why it is used
   * in this case to bypass all the segment filtering
   */
  if (
    isBatch ||
    !_.isEmpty(segments) ||
    !_.isEmpty(account_segments) ||
    !_.intersection(synchronized_properties, _.keys(user)).length === 0 ||
    !_.intersection(synchronized_account_properties, _.keys(account)).length ===
      0
  ) {
    // Filter if no interesting changes.
    return true;
  }
  return false;
}
