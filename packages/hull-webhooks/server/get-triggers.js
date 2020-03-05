// @flow
import type { HullEntityName } from "hull";
import type { PrivateSettings } from "../types";

const getTriggers = (entityType: HullEntityName) => (
  private_settings: PrivateSettings
): { [string]: Array<string> | boolean } => {
  const {
    synchronized_segments_enter,
    synchronized_segments_leave,
    synchronized_attributes,
    synchronized_events
  } = private_settings;

  const include_new = synchronized_events.includes("CREATED");

  return {
    [`entered_${entityType}_segments`]: synchronized_segments_enter,
    [`left_${entityType}_segments`]: synchronized_segments_leave,
    [`${entityType}_attribute_updated`]: synchronized_attributes,
    [`${entityType}_events`]: synchronized_events,
    ...(include_new ? { [`is_new_${entityType}`]: true } : {})
  };
};

export default getTriggers;
