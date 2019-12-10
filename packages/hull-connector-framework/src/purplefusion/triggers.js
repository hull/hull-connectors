const {
  HullUserAttributeChangedTrigger,
  HullUserSegmentChangedTrigger,
  EntityCreatedTrigger,
  HullUserEventTrigger,
  HullAccountAttributeChangedTrigger,
  HullAccountSegmentChangedTrigger,
} = require("./hull-service-objects");

const {
  validateSegments,
  validateChanges,
  validateEvents,
  required,
} = require("./validate-trigger");

const triggers = {
  user_segments: {
    objectType: HullUserSegmentChangedTrigger,
    validations: {
      "segments": [validateSegments]
    }
  },
  entered_user_segments: {
    objectType: HullUserSegmentChangedTrigger,
    validations: {
      "changes.segments.entered": [required, validateSegments]
    }
  },
  left_user_segments: {
    objectType: HullUserSegmentChangedTrigger,
    validations: {
      "changes.segments.left": [required, validateSegments]
    }
  },
  user_attribute_updated: {
    objectType: HullUserAttributeChangedTrigger,
    validations: {
      "changes.user": [required, validateChanges]
    }
  },
  user_events: {
    objectType: HullUserEventTrigger,
    validations: {
      events: [validateEvents]
    }
  },
  is_new: {
    objectType: EntityCreatedTrigger,
    validations: {
      changes: { is_new: true }
    }
  },
  account_segments: {
    objectType: HullUserSegmentChangedTrigger,
    validations: {
      "account_segments": [validateSegments]
    }
  },
  account_attribute_updated: {
    objectType: HullAccountAttributeChangedTrigger,
    validations: {
      "changes.account": [required, validateChanges]
    }
  },
  entered_account_segments: {
    objectType: HullAccountSegmentChangedTrigger,
    validations: {
      "changes.account_segments.entered": [required, validateSegments]
    }
  },
  left_account_segments: {
    objectType: HullAccountSegmentChangedTrigger,
    validations: {
      "changes.account_segments.left": [required, validateSegments]
    }
  }
};

module.exports = {
  triggers
};
