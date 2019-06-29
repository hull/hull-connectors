// @flow

// ====================================
//   Notification DataTypes
// ====================================
/**
 * Attributes (traits) changes is an object map where keys are attribute (trait) names and value is an array
 * where first element is an old value and second element is the new value.
 * This object contain information about changes on one or multiple attributes (that's thy attributes and changes are plural).
 */
export type HullAttributesChanges = {|
  [HullAttributeName]: [HullAttributeValue, HullAttributeValue]
|};

/**
 * Represents segment changes in TUserChanges.
 * The object contains two params which mark which segments user left or entered.
 * It may contain none, one or multiple HullSegment in both params.
 */
export type HullSegmentsChanges = {
  entered?: Array<HullSegment>,
  left?: Array<HullSegment>
};

/**
 * Object containing all changes related to User in HullUserUpdateMessage
 */
export type HullUserChanges = {
  is_new: boolean,
  user: HullAttributesChanges,
  account: HullAttributesChanges,
  segments: HullSegmentsChanges, // should be segments or user_segments?
  account_segments: HullSegmentsChanges
};

/**
 * Object containing all changes related to Account in HullUserUpdateMessage
 */
export type HullAccountChanges = {
  is_new: boolean,
  account: HullAttributesChanges,
  account_segments: HullSegmentsChanges
};

/**
 * A message sent by the platform when any event, attribute (trait) or segment change happens on the user.
 */
export type HullUserUpdateMessage = {
  message_id: string,
  user: HullUser,
  changes: HullUserChanges,
  segments: Array<HullUserSegment>,
  segment_ids: Array<string>,
  // user_segments: Array<HullUserSegment>,
  // user_segment_ids: Array<string>,
  // matching_user_segments: Array<HullUserSegment>,
  account_segments: Array<HullAccountSegment>,
  account_segment_ids: Array<string>,
  // matching_account_segments: Array<HullUserSegment>,
  events: Array<HullEvent>,
  account: HullAccount
};
export type HullUserDeleteMessage = {};

/**
 * A message sent by the platform when any attribute (trait) or segment change happens on the account.
 */
export type HullAccountUpdateMessage = {
  changes: HullAccountChanges,
  account_segments: Array<HullAccountSegment>,
  account_segment_ids: Array<string>,
  matching_account_segments: Array<HullUserSegment>,
  account: HullAccount,
  message_id: string
};
export type HullAccountDeleteMessage = {};

/**
 * A message sent by the platform when a Segment is updated
 */
export type HullSegmentUpdateMessage = {|
  id: string,
  name: string,
  created_at: string,
  updated_at: string,
  message_id: string
|};
export type HullUserSegmentUpdateMessage = HullSegmentUpdateMessage & {|
  type: "users_segment"
|};
export type HullAccountSegmentUpdateMessage = HullSegmentUpdateMessage & {|
  type: "accounts_segment"
|};
export type HullUserSegmentDeleteMessage = HullSegmentUpdateMessage & {|
  type: "users_segment"
|};
export type HullAccountSegmentDeleteMessage = HullSegmentUpdateMessage & {|
  type: "accounts_segment"
|};
export type HullSegmentDeleteMessage = {|
  id: string,
  name: string,
  type: "users_segment" | "accounts_segment",
  created_at: string,
  updated_at: string
|};

/**
 * A message sent by the platform when a Segment is updated
 */
export type HullConnectorUpdateMessage = {|
  ...$Exact<HullConnector>,
  secret: string
|};
export type HullConnectorDeleteMessage = {|
  ...$Exact<HullConnector>,
  secret: string
|};

/**
 * The whole notification object
 */
export type HullNotification = {
  configuration: {
    id: string,
    secret: string,
    organization: string
  },
  channel: string,
  connector: HullConnector,
  segments: Array<HullUserSegment>,
  accounts_segments: Array<HullAccountSegment>,
  messages?: Array<HullUserUpdateMessage> | Array<HullAccountUpdateMessage>,
  notification_id: string
};
