// @flow

const {
  HullUserAttributeChangedTrigger,
  HullUserSegmentChangedTrigger,
  EntityCreatedTrigger,
  HullUserEventTrigger,
  HullUserAccountLinkedTrigger
} = require("../../hull-service-objects");

const {
  validateSegments,
  excludeSegments,
  validateChanges,
  validateEvents,
  required
} = require("../validations");

const {
  filterSegments,
  filterAttributeChanges,
  filterNew,
  filterEvents,
  filterNone
} = require("../filters");

const userTriggers = (entityType) => {
  return {
    [`${entityType}_segments_whitelist`]: {
      type: HullUserSegmentChangedTrigger,
      filters: {
        segments: [filterNone]
      },
      validations: {
        segments: [validateSegments]
      }
    },
    [`${entityType}_segments_blacklist`]: {
      type: HullUserSegmentChangedTrigger,
      filters: {
        segments: [filterNone]
      },
      validations: {
        segments: [excludeSegments]
      }
    },
    [`${entityType}_segments_entered`]: {
      type: HullUserSegmentChangedTrigger,
      filters: {
        "changes.segments.entered": [filterSegments]
      },
      validations: {
        "changes.segments.entered": [required, validateSegments]
      }
    },
    [`${entityType}_segments_left`]: {
      type: HullUserSegmentChangedTrigger,
      filters: {
        "changes.segments.left": [filterSegments]
      },
      validations: {
        "changes.segments.left": [required, validateSegments]
      }
    },
    [`${entityType}_segments_updated`]: {
      type: HullUserSegmentChangedTrigger,
      filters: {},
      validations: {
        "changes.segments": [required]
      }
    },
    [`${entityType}_events`]: {
      type: HullUserEventTrigger,
      filters: {
        events: [filterEvents]
      },
      validations: {
        events: [required, validateEvents]
      }
    },
    [`${entityType}_attribute_updated`]: {
      type: HullUserAttributeChangedTrigger,
      filters: {
        "changes.user": [filterAttributeChanges]
      },
      validations: {
        "changes.user": [required, validateChanges]
      }
    },
    [`is_new_${entityType}`]: {
      type: EntityCreatedTrigger,
      filters: {
        "changes.is_new": [filterNew]
      },
      validations: {
        user: [required],
        changes: { is_new: true }
      }
    },
    [`${entityType}_account_linked`]: {
      type: HullUserAccountLinkedTrigger,
      filters: {
        user: [filterNone]
      },
      validations: {
        user: [required],
        "changes.account.id": [required]
      }
    },
    //TODO: Deprecate to have uniform naming
    [`${entityType}_segments`]: {
      type: HullUserSegmentChangedTrigger,
      filters: {
        segments: [filterNone]
      },
      validations: {
        segments: [validateSegments]
      }
    },
    [`entered_${entityType}_segments`]: {
      type: HullUserSegmentChangedTrigger,
      filters: {
        "changes.segments.entered": [filterSegments]
      },
      validations: {
        "changes.segments.entered": [required, validateSegments]
      }
    },
    [`left_${entityType}_segments`]: {
      type: HullUserSegmentChangedTrigger,
      filters: {
        "changes.segments.left": [filterSegments]
      },
      validations: {
        "changes.segments.left": [required, validateSegments]
      }
    }
  }
};

export default userTriggers;
