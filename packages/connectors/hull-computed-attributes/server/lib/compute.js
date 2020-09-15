// @flow
import _ from "lodash";
import type { HullUserUpdateMessage } from "hull";

const IGNORE_IDENTICAL = true;

// Mapping Logic. Maps a source value to a result value
const applyMapping = (source, data) => {
  const { property, mapping, value, unknown } = source;
  const v = _.get(data, property);
  // With this you set the attribute to a hardcoded value.
  // Use last in the fallback list to set a default
  if (value !== undefined) {
    return value;
  }
  // If we have a Mapping entry or an Unknown entry, perform the matching
  if (_.has(source, "mapping") || _.has(source, "unknown")) {
    const mapped = (_.find(mapping, { source: v }) || {}).destination;
    if (mapped === undefined) {
      return unknown;
    }
    return mapped;
  }
  // Otherwise return the found value
  return v;
};

// Fallback Logic. First defined value in sources.
const lookup = ({ data, sources }) =>
  _.reduce(
    sources,
    (value, source) => {
      if (value === undefined || _.isEmpty(value)) {
        return applyMapping(source, data);
      }
      return value;
    },
    undefined
  );

// Looks up Fallbacks from a Data object
// TODO: Can be simplified since we already dupecheck in the VM for unchanged.
// We want to double check what happens with setIfNull and dupe values

const getFallbacks = (target_entity, data, fallbacks) =>
  _.reduce(
    fallbacks,
    (traits, { operation, sources, target }) => {
      const target_key = [target_entity, ..._.toPath(target)];
      const previousValue = _.get(data, target_key);
      const value = lookup({
        data,
        sources:
          // Don't change if operation is setIfNull and we already have a value
          operation === "setIfNull"
            ? [{ property: target_key }, ...sources]
            : sources
      });
      if (
        // Don't change if value empty (but will change on null)
        value === undefined ||
        // Don't change if value didn't change
        (previousValue === value && IGNORE_IDENTICAL)
      ) {
        return traits;
      }
      _.set(
        traits,
        target.replace(".", "/"),
        operation === "setIfNull" && previousValue !== undefined
          ? previousValue
          : value
      );
      return traits;
    },
    {}
  );

export default async function compute({
  fallbacks = [],
  payload = {}
}: {
  fallbacks: any,
  payload: HullUserUpdateMessage
}) {
  if (!fallbacks.length) {
    return {};
  }
  return getFallbacks("user", payload, fallbacks);
}
