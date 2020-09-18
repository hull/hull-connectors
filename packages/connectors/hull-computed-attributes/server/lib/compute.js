// @flow
import _ from "lodash";
import type { HullUserUpdateMessage } from "hull";

const IGNORE_IDENTICAL = true;

// Mapping Logic. Maps a source value to a result value
const applyMapping = (source, data) => {
  const { property, mapper, value } = source;

  // With this you set the attribute to a hardcoded value.
  // Use last in the fallback list to set a default
  if (value) {
    return value;
  }

  if (property) {
    return _.get(data, property);
  }

  // If we have a Mapping entry perform the matching
  if (mapper) {
    const { mapping, property: mappingProperty } = mapper;
    const mapped = (
      _.find(mapping, { source: _.get(data, mappingProperty) }) || {}
    ).destination;
    return mapped;
  }

  return undefined;
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
    // Skip undefined traits
    _.filter(fallbacks, ({ target }) => !!target),
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
