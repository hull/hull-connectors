const {
  HullUserAttributeChangedTrigger,
  HullUserSegmentChangedTrigger,
  HullUserCreatedTrigger,
  HullUserEventTrigger,
  HullAccountAttributeChangedTrigger,
  HullAccountSegmentChangedTrigger,
  HullAccountCreatedTrigger,
} = require("./hull-service-objects");

const {
  validateChanges,
  validateSegments,
  validateEvents,
  required,
} = require("./validate-trigger");

const triggers = {
  userUpdate: {
    userEnteredSegment: {
      objectType: HullUserSegmentChangedTrigger,
      validations: {
        "changes.segments.entered": [required]
      },
      action: "entered_segment",
      entityType: "user",
      filter: [
        "user",
        "account",
        "segments",
        "changes.segments.entered",
        "account_segments",
        "message_id"
      ]
    },
    userLeftSegment: {
      objectType: HullUserSegmentChangedTrigger,
      validations: {
        "changes.segments.left": [required]
      },
      action: "left_segment",
      entityType: "user",
      filter: [
        "user",
        "account",
        "segments",
        "changes.segments.left",
        "account_segments",
        "message_id"
      ]
    },
    userAttributeUpdated: {
      objectType: HullUserAttributeChangedTrigger,
      validations: {
        changes: [required, validateChanges([ "user", "account" ])]
      },
      action: "attribute_updated",
      entityType: "user",
      filter: [
        "user",
        "account",
        "segments",
        "changes.user",
        "changes.account",
        "account_segments",
        "message_id"
      ]
    },
    userEventCreated: {
      objectType: HullUserEventTrigger,
      validations: {
        events: [validateEvents]
      },
      action: "created",
      entityType: "user_event",
      filter: [
        "user",
        "account",
        "segments",
        "account_segments",
        "events",
        "message_id"
      ]
    },
    userCreated: {
      objectType: HullUserCreatedTrigger,
      validations: {
        changes: { is_new: true },
        user: [required]
      },
      action: "created",
      entityType: "user",
      filter: [
        "user",
        "account",
        "segments",
        "account_segments",
        "message_id"
      ]
    }
  },
  accountUpdate: {
    accountEnteredSegment: {
      objectType: HullAccountSegmentChangedTrigger,
      validations: {
        "changes.account_segments.entered": [required]
      },
      action: "entered_segment",
      entityType: "account",
      filter: [
        "account",
        "changes.account_segments.entered",
        "account_segments",
        "message_id"
      ]
    },
    accountLeftSegment: {
      objectType: HullAccountSegmentChangedTrigger,
      validations: {
        "changes.account_segments.left": [required]
      },
      action: "left_segment",
      entityType: "account",
      filter: [
        "account",
        "changes.account_segments.left",
        "account_segments",
        "message_id"
      ]
    },
    accountAttributeUpdated: {
      objectType: HullAccountAttributeChangedTrigger,
      validations: {
        changes: [required, validateChanges([ "account" ])]
      },
      action: "attribute_updated",
      entityType: "account",
      filter: [
        "account",
        "changes.account",
        "account_segments",
        "message_id"
      ]
    },
    accountCreated: {
      objectType: HullAccountCreatedTrigger,
      validations: {
        changes: { is_new: true },
        account: [required]
      },
      action: "created",
      entityType: "account",
      filter: [
        "account",
        "account_segments",
        "message_id"
      ]
    }
  }
};

module.exports = {
  triggers
};
