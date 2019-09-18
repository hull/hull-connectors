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
export function isInSegments(userSegments = [], segmentsListIds = []) {
  return (
    _.isEmpty(segmentsListIds) ||
    _.intersection(userSegments.map(({ id }) => id), segmentsListIds).length > 0
  );
}

export function getDomain(
  account: HullAccount = {},
  user: HullUser = {},
  attribute = "domain"
) {
  return (
    (attribute.indexOf("account.") === 0
      ? account[attribute.replace(/^account./, "")]
      : user[attribute]) ||
    account.domain ||
    account["clearbit/domain"] ||
    user["clearbit/employment_domain"] ||
    user["clearbit_company/domain"] ||
    user.domain
  );
}

export function now() {
  return new Date().toISOString();
}

export function isValidIpAddress(ip) {
  return (
    ip !== "0" &&
    rangeCheck.isIP(ip) &&
    !rangeCheck.inRange(ip, excludes.ip_ranges)
  );
}
