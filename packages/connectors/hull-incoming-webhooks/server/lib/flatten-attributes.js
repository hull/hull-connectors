// @flow
import _ from "lodash";
import type { Traits } from "../../types";

// Creates a flat object from `/` and `source` parameters
const flatten = ({ attributes, context }: $PropertyType<Traits, "traits">) => {
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
  return {
    attributes: payload,
    context
  };
};
// _.reduce(
//   traits,
//   (payload, { properties, context = {} } = {}) => {
//   },
//   {}
// );

export default flatten;
