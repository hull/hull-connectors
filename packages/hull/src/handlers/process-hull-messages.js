// @flow
import fp from "lodash/fp";
import type {
  HullConnector,
  HullNotificationHandlerOptions,
  HullUserUpdateMessage,
  HullSegment,
  HullAccountUpdateMessage
} from "../types";

const {
  trimTraitsPrefixFromUserMessage,
  // computeMatchingSegments,
  // filterMatchingSegments,
  remapUserSegmentsKey
} = require("../utils");

const processHullMessage = ({
  // options,
  // connector,
  // segments,
  channel
}: // , isBatch
{
  options: HullNotificationHandlerOptions,
  channel: "user:update" | "account:update",
  segments: {
    user_segments?: Array<HullSegment>,
    account_segments?: Array<HullSegment>
  },
  connector: HullConnector,
  isBatch: boolean
}): Array<HullUserUpdateMessage> | Array<HullAccountUpdateMessage> => {
  // const { filter } = options;

  // "remapUserSegmentsKey" ensures that we have the following keys
  // on the User profile:
  // - `user_segments`
  // - `user_segment_ids`
  //
  // "computeMatchingSegments" adds `message.matching_user_segments` and
  // `message.matching_account_segments`
  // with the segments that match;
  //
  // "filterMatchingSegments" filter the messages depending on
  // wether some segments have matched.
  // relies on `matching_user_segments` and `matching_account_segments`
  // to exist and have length
  // This one is only applied if we're not in batch mode.

  // const compute = computeMatchingSegments({
  //   connector,
  //   filter,
  //   segments
  // });

  const trim =
    channel === "user:update" ? trimTraitsPrefixFromUserMessage : fp.identity;

  // const filterMatches = isBatch ? fp.identity : filterMatchingSegments;

  return fp.map(
    fp.flow(
      trim,
      remapUserSegmentsKey
      // , compute
    )
  );

  // return fp.flow(
  //   fp.map(
  //     fp.flow(
  //       trim,
  //       remapUserSegmentsKey,
  //       compute
  //     )
  //   )
  //   // ,filterMatches
  // );
};

export default processHullMessage;
