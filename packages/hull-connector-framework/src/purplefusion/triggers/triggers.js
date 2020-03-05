// @flow

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

const {
  filterSegments,
  filterAttributeChanges,
  filterEvents,
  filterNew,
  filterNone
} = require("./filters");

const TRIGGERS = {
  user_segments: {
    type: HullUserSegmentChangedTrigger,
    filters: {
      "segments": [filterNone]
    },
    validations: {
      "segments": [validateSegments]
    }
  },
  entered_user_segments: {
    type: HullUserSegmentChangedTrigger,
    filters: {
      "changes.segments.entered": [filterSegments]
    },
    validations: {
      "changes.segments.entered": [required, validateSegments]
    }
  },
  left_user_segments: {
    type: HullUserSegmentChangedTrigger,
    filters: {
      "changes.segments.left": [filterSegments]
    },
    validations: {
      "changes.segments.left": [required, validateSegments]
    }
  },
  user_attribute_updated: {
    type: HullUserAttributeChangedTrigger,
    filters: {
      "changes.user": [filterAttributeChanges]
    },
    validations: {
      "changes.user": [required, validateChanges]
    }
  },
  user_events: {
    type: HullUserEventTrigger,
    filters: {
      "events": [filterEvents]
    },
    validations: {
      "events": [validateEvents]
    }
  },
  is_new_user: {
    type: EntityCreatedTrigger,
    filters: {
      "changes.is_new": [filterNew]
    },
    validations: {
      user: [required],
      changes: { is_new: true },
    }
  },
  is_new_account: {
    type: EntityCreatedTrigger,
    filters: {
      "changes.is_new": [filterNew]
    },
    validations: {
      account: [required],
      changes: { is_new: true }
    }
  },
  account_segments: {
    type: HullUserSegmentChangedTrigger,
    filters: {
      "account_segments": [filterNone]
    },
    validations: {
      "account_segments": [validateSegments]
    }
  },
  account_attribute_updated: {
    type: HullAccountAttributeChangedTrigger,
    filters: {
      "changes.account": [filterAttributeChanges]
    },
    validations: {
      "changes.account": [required, validateChanges]
    }
  },
  entered_account_segments: {
    type: HullAccountSegmentChangedTrigger,
    filters: {
      "changes.account_segments.entered": [filterSegments]
    },
    validations: {
      "changes.account_segments.entered": [required, validateSegments]
    }
  },
  left_account_segments: {
    type: HullAccountSegmentChangedTrigger,
    filters: {
      "changes.account_segments.left": [filterSegments]
    },
    validations: {
      "changes.account_segments.left": [required, validateSegments]
    }
  }
};

export default TRIGGERS;
