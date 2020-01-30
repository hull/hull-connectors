// @flow
import type { HullSegment } from "../types";

type Message = {
  matching_user_segments?: Array<HullSegment>,
  matching_account_segments?: Array<HullSegment>
};

export default function filterMatchingSegments({
  matching_user_segments,
  matching_account_segments
}: Message): Boolean %checks {
  return (
    (matching_user_segments && matching_user_segments.length) ||
    (matching_account_segments && matching_account_segments.length)
  );
}
