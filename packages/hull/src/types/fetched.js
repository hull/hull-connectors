// @flow

import type {
  HullUser,
  HullAccount,
  HullEvent,
  HullUserSegment,
  HullAccountSegment
} from "./index";

export type HullFetchedUser = {
  user: HullUser,
  segments: Array<HullUserSegment>,
  segment_ids: Array<string>,
  events?: Array<HullEvent>,
  account?: HullAccount,
  account_segments?: Array<HullAccountSegment>,
  account_segments_ids?: Array<string>
};

export type HullFetchedAccount = {
  account: HullAccount,
  account_segments: Array<HullAccountSegment>,
  account_segments_ids: Array<string>
};
