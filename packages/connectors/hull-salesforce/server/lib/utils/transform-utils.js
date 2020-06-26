/* @flow */

const _ = require("lodash");
const moment = require("moment");

function transformEvent(destinationObject: string, options: Object = {}, message: Object, event: Object) {
  const hullEventIdentifier = _.get(options, "hull_event_id", null);
  const sfExternalIdentifier = _.get(options, "salesforce_external_id", null);
  const referenceMappings = _.get(options, "task_references_outbound", []);
  const attributeMappings = _.get(options, "task_attributes_outbound", []);

  if (hullEventIdentifier === "id") {
    if (_.get(event, hullEventIdentifier, _.get(event, "event_id", null)) === null) {
      return undefined;
    }
  } else if (_.get(event, hullEventIdentifier, null) === null) {
    return undefined;
  }

  const result = {};

  _.forEach(referenceMappings, (r) => {
    if (r.service && r.hull && _.get(message.user, r.hull, null) !== null) {
      _.set(result, r.service, _.get(message.user, r.hull, null));
    }
  });

  _.forEach(attributeMappings, (m) => {
    if (m.hull && m.hull.startsWith("user.")) {
      if (m.service && _.get(message.user, m.hull.replace("user.", ""), null) !== null) {
        _.set(result, m.service, _.get(message.user, m.hull.replace("user.", ""), null));
      }
    } else if (m.hull && m.hull.startsWith("account.")) {
      if (m.service && _.get(message.user, m.hull.replace("account.", ""), null) !== null) {
        _.set(result, m.service, _.get(message.user, m.hull.replace("account.", ""), null));
      }
    } else if (m.service && m.hull && _.get(event, m.hull, null) !== null) {
      if (m.hull === "created_at") {
        const created_at = _.get(event, m.hull, null);
        if (!_.isNil(created_at)) {
          _.set(result, m.service, moment(created_at.toString())
            .toISOString());
        }
      } else if (_.isString(_.get(event, m.hull, null))) {
        if (_.get(event, m.hull, "").length > 255) {
          _.set(result, m.service, _.get(event, m.hull, "").substr(0, 255));
        } else {
          _.set(result, m.service, _.get(event, m.hull, null));
        }
      } else {
        _.set(result, m.service, _.get(event, m.hull, null));
      }
    }
  });

  if (destinationObject === "Task") {
    _.set(result, "Type", _.get(options, "task_type", null));
  }

  if (hullEventIdentifier === "id") {
    _.set(result, sfExternalIdentifier, _.get(event, hullEventIdentifier, _.get(event, "event_id", null)));
  } else {
    _.set(result, sfExternalIdentifier, _.get(event, hullEventIdentifier, null));
  }

  return result;
}

module.exports = {
  transformEvent
};
