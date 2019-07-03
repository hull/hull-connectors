// @flow
import type {
  HullAttributeName,
  HullAttributeValue,
  HullEntity,
  HullEntityAttributes
} from "../types";

const _ = require("lodash");

type HullEntityNested = {
  ...HullEntity,
  [HullAttributeName]: {
    [HullAttributeName]: HullAttributeValue
  }
};

/**
 * The Hull API returns traits in a "flat" format, with '/' delimiters in the key.
 * This method can be used to group those traits into subobjects:
 *
 * @memberof Utils
 * @method   traits.group
 * @public
 * @param  {Object} user flat object
 * @return {Object} nested object
 * @example
 * hullClient.utils.traits.group({
 *   email: "romain@user",
 *   name: "name",
 *   "traits_coconut_name": "coconut",
 *   "traits_coconut_size": "large",
 *   "traits_cb/twitter_bio": "parisian",
 *   "traits_cb/twitter_name": "parisian",
 *   "traits_group/name": "groupname",
 *   "traits_zendesk/open_tickets": 18
 * });
 *
 * // returns
 * {
 *   "email": "romain@user",
 *   "name": "name",
 *   "traits": {
 *     "coconut_name": "coconut",
 *     "coconut_size": "large"
 *   },
 *   "cb": {
 *     "twitter_bio": "parisian",
 *     "twitter_name": "parisian"
 *   },
 *   "group": {
 *     "name": "groupname"
 *   },
 *   "zendesk": {
 *     "open_tickets": 18
 *   }
 * };
 */
function group(user: HullEntity): HullEntityNested {
  return _.reduce(
    user,
    (grouped, value, key) => {
      let dest = key;
      if (key.match(/^traits_/)) {
        if (key.match(/\//)) {
          dest = key.replace(/^traits_/, "");
        } else {
          dest = key.replace(/^traits_/, "traits/");
        }
      }
      return _.setWith(grouped, dest.split("/"), value, Object);
    },
    {}
  );
}

// Creates a flat object from `/` and `source` parameters
function applyContext(attributes: Object, context: Object): Object {
  const payload = {};
  if (attributes) {
    const { source } = context;
    _.map(
      _.mapKeys(attributes, (v, k) =>
        (source ? `${source}/${k}` : k).replace(".", "/")
      ),
      (v, k) => _.setWith(payload, k, v)
    );
  }
  return payload;
}

function normalize(traits: HullEntityAttributes): HullEntityAttributes {
  return _.reduce(
    traits,
    (memo, value, key) => {
      if (!_.isObject(value)) {
        value = { operation: "set", value };
      }
      if (!value.operation) {
        value.operation = "set";
      }
      memo[key] = value;
      return memo;
    },
    {}
  );
}

module.exports = {
  group,
  applyContext,
  normalize
};
