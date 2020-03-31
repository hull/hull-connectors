// @flow
import type { HullEntityName, HullTriggerSet } from "hull";
import type { PrivateSettings } from "../types";

const getTriggers = (
  entity: HullEntityName,
  private_settings: PrivateSettings
): HullTriggerSet => {
  const {
    synchronized_segments_enter,
    synchronized_segments_leave,
    synchronized_attributes,
    synchronized_events
  } = private_settings;

  const include_new = synchronized_events.includes("CREATED");

  return {
    [`${entity}_segments_entered`]: synchronized_segments_enter,
    [`${entity}_segments_left`]: synchronized_segments_leave,
    [`${entity}_attribute_updated`]: synchronized_attributes,
    [`${entity}_events`]: synchronized_events,
    ...(include_new ? { [`is_new_${entity}`]: true } : {})
  };

  // TODO: Support boolean logic
  // {
  //   and: [
  //     {}
  //     {}
  //     {}
  //     {
  //       or: []
  //     }
  //   ]
  // }
};

export default getTriggers;
