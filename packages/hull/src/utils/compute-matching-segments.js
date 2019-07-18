// @flow
import _ from "lodash";
import type {
  HullConnector,
  HullUserUpdateMessage,
  HullSegment,
  HullAccountUpdateMessage
} from "../types";

type ComputeMatchingSegmentConfig = {
  connector: HullConnector,
  segments: {
    user_segments?: Array<HullSegment>,
    account_segments?: Array<HullSegment>
  },
  filter: {
    user_segments?: string,
    account_segments?: string
  }
};

const computeMatchingSegments = ({
  connector,
  filter,
  segments
}: ComputeMatchingSegmentConfig) => (
  message: HullUserUpdateMessage | HullAccountUpdateMessage
): HullUserUpdateMessage | HullAccountUpdateMessage => {
  if (filter) {
    // For both `user_segments` and `account_segments` if they have an entry
    _.map(filter, (v, k) => {
      // Get the IDs for the defined setting key.
      const ids = _.get(connector, v);
      message[`matching_${k}`] = _.filter(segments[k], s =>
        _.includes(ids, s.id)
      );
    });
  }
  return message;
};

module.exports = computeMatchingSegments;
