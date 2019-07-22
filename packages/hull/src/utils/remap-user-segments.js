// @flow
import type { HullUserUpdateMessage } from "../types";

function remapUserSegmentsKey(
  message: HullUserUpdateMessage
): HullUserUpdateMessage {
  return {
    ...message,
    user_segments: message.segments,
    user_segment_ids: message.segment_ids
  };
}

module.exports = remapUserSegmentsKey;
