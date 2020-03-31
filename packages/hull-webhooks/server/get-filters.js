// @flow
import type { HullEntityName, HullTriggerSet } from "hull";
import type { PrivateSettings } from "../types";

const getTriggers = (
  entity: HullEntityName,
  private_settings: PrivateSettings
): HullTriggerSet => ({
  [`${entity}_segments_blacklist`]: private_settings.synchronized_segments_blacklist,
  [`${entity}_segments_whitelist`]: private_settings.synchronized_segments_whitelist
});
export default getTriggers;
