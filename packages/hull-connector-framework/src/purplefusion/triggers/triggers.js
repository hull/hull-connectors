const {
  HullUserAttributeChangedTrigger,
  HullUserSegmentChangedTrigger,
  EntityCreatedTrigger,
  HullUserEventTrigger,
  HullAccountAttributeChangedTrigger,
  HullAccountSegmentChangedTrigger,
} = require("../hull-service-objects");

const {
  validateSegments,
  validateChanges,
  validateEvents,
  required,
} = require("./validations");

const triggers = {
  user_segments: {
    type: HullUserSegmentChangedTrigger,
    filter: [
      "segments"
    ],
    validations: {
      "segments": [validateSegments]
    }
  },
  entered_user_segments: {
    type: HullUserSegmentChangedTrigger,
    filter: [
      "changes.segments.entered"
    ],
    validations: {
      "changes.segments.entered": [required, validateSegments]
    }
  },
  left_user_segments: {
    type: HullUserSegmentChangedTrigger,
    filter: [
      "changes.segments.left"
    ],
    validations: {
      "changes.segments.left": [required, validateSegments]
    }
  },
  user_attribute_updated: {
    type: HullUserAttributeChangedTrigger,
    filter: [
      "changes.user"
    ],
    validations: {
      "changes.user": [required, validateChanges]
    }
  },
  user_events: {
    type: HullUserEventTrigger,
    filter: [
      "events"
    ],
    validations: {
      "events": [validateEvents]
    }
  },
  is_new: {
    type: EntityCreatedTrigger,
    filter: [
      "changes.is_new"
    ],
    validations: {
      changes: { is_new: true }
    }
  },

  account_segments: {
    type: HullUserSegmentChangedTrigger,
    filter: [
      "account_segments"
    ],
    validations: {
      "account_segments": [validateSegments]
    }
  },
  account_attribute_updated: {
    type: HullAccountAttributeChangedTrigger,
    filter: [
      "changes.account"
    ],
    validations: {
      "changes.account": [required, validateChanges]
    }
  },
  entered_account_segments: {
    type: HullAccountSegmentChangedTrigger,
    filter: [
      "changes.account_segments.entered"
    ],
    validations: {
      "changes.account_segments.entered": [required, validateSegments]
    }
  },
  left_account_segments: {
    type: HullAccountSegmentChangedTrigger,
    filter: [
      "changes.account_segments.left"
    ],
    validations: {
      "changes.account_segments.left": [required, validateSegments]
    }
  }
};

module.exports = {
  triggers
};
