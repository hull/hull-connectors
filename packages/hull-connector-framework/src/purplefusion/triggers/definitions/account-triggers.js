// @flow

const {
  HullAccountAttributeChangedTrigger,
  HullAccountSegmentChangedTrigger,
  EntityCreatedTrigger,
} = require("../../hull-service-objects");

const {
  validateSegments,
  excludeSegments,
  validateChanges,
  required,
  empty
} = require("../validations");

const {
  filterSegments,
  filterAttributeChanges,
  filterNew,
  filterNone
} = require("../filters");

const accountTriggers = (entityType) => {
  return {
    [`is_new_${entityType}`]: {
      type: EntityCreatedTrigger,
      filters: {
        "changes.is_new": [filterNew]
      },
      validations: {
        user: [empty],
        account: [required],
        changes: { is_new: true }
      }
    },
    [`${entityType}_segments_whitelist`]: {
      type: HullAccountSegmentChangedTrigger,
      filters: {
        account_segments: [filterNone]
      },
      validations: {
        account_segments: [validateSegments]
      }
    },
    [`${entityType}_segments_blacklist`]: {
      type: HullAccountSegmentChangedTrigger,
      filters: {
        segments: [filterNone]
      },
      validations: {
        account_segments: [excludeSegments]
      }
    },
    [`${entityType}_attribute_updated`]: {
      type: HullAccountAttributeChangedTrigger,
      filters: {
        "changes.account": [filterAttributeChanges]
      },
      validations: {
        "changes.account": [required, validateChanges]
      }
    },
    [`${entityType}_segments_entered`]: {
      type: HullAccountSegmentChangedTrigger,
      filters: {
        "changes.account_segments.entered": [filterSegments]
      },
      validations: {
        user: [empty],
        "changes.account_segments.entered": [required, validateSegments]
      }
    },
    [`${entityType}_segments_left`]: {
      type: HullAccountSegmentChangedTrigger,
      filters: {
        "changes.account_segments.left": [filterSegments]
      },
      validations: {
        user: [empty],
        "changes.account_segments.left": [required, validateSegments]
      }
    },
    [`${entityType}_segments_updated`]: {
      type: HullAccountSegmentChangedTrigger,
      filters: {},
      validations: {
        user: [empty],
        "changes.account_segments": [required]
      }
    },
    //TODO: Deprecate to have uniform naming
    [`${entityType}_segments`]: {
      type: HullAccountSegmentChangedTrigger,
      filters: {
        account_segments: [filterNone]
      },
      validations: {
        account_segments: [validateSegments]
      }
    },
    [`entered_${entityType}_segments`]: {
      type: HullAccountSegmentChangedTrigger,
      filters: {
        "changes.account_segments.entered": [filterSegments]
      },
      validations: {
        user: [empty],
        "changes.account_segments.entered": [required, validateSegments]
      }
    },
    [`left_${entityType}_segments`]: {
      type: HullAccountSegmentChangedTrigger,
      filters: {
        "changes.account_segments.left": [filterSegments]
      },
      validations: {
        user: [empty],
        "changes.account_segments.left": [required, validateSegments]
      }
    }
  }
};

export default accountTriggers;
