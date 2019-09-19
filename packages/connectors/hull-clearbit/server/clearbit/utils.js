// @flow

import _ from "lodash";
import rangeCheck from "range_check";
import type { HullAccount, HullUser } from "hull";
import excludes from "../excludes";

/**
 * Check if a user belongs to one of the segments listed
 * @param  {Array<Segment>} userSegments - A list of segments
 * @param  {Array<ObjectId>} segmentsListIds - A list of segment ids
 * @return {Boolean}
 */
export function isInSegments(
  segmentDefinitions: Array<{ id: string, [string]: any }> = [],
  segmentsListIds: Array<string> = []
) {
  return (
    _.isEmpty(segmentsListIds) ||
    _.intersection(segmentDefinitions.map(({ id }) => id), segmentsListIds)
      .length > 0
  );
}

export function getDomain(account: HullAccount): string {
  // $FlowFixMe
  return account.domain || account["clearbit/domain"];
}

export function now() {
  return new Date().toISOString();
}

export function isValidIpAddress(ip?: string) {
  return (
    !!ip &&
    ip !== "0" &&
    rangeCheck.isIP(ip) &&
    !rangeCheck.inRange(ip, excludes.ip_ranges)
  );
}
