// @flow

import type { HullUserSegment } from "hull";

const _ = require("lodash");

function filterMessagesBySegments(
  messages: Array<Object>,
  segmentInclusionList: Array<HullUserSegment>,
  hullType: string = "user"
): Array<Object> {
  const segmentPath = hullType === "account" ? "account_segments" : "segments";
  return _.filter(messages, message => {
    const segmentIds = _.compact(_.get(message, segmentPath, [])).map(
      s => s.id
    );
    return _.intersection(segmentIds, segmentInclusionList).length > 0;
  });
}

module.exports = {
  filterMessagesBySegments
};
