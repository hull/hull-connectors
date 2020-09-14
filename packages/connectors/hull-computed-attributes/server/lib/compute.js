// @flow
import _ from "lodash";
import jsonata from "jsonata";

import type { HullUserUpdateMessage } from "hull";

const IGNORE_IDENTICAL = true;

// Mapping Logic. Maps a source value to a result value
const applyMapping = (source, data) => {
  const { property, mapping, value, unknown } = source;
  const v = jsonata(property).evaluate(data);
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
      const value = lookup({
        data,
        sources
      });
      const previousValue = _.get(data, [target_entity, ..._.toPath(target)]);
      if (
        // Don't change if value empty (but will change on null)
        value === undefined ||
        // Don't change if operation is setIfNull and we already have a value
        (previousValue !== undefined && operation === "setIfNull") ||
        // Don't change if value didn't change
        (previousValue === value && IGNORE_IDENTICAL)
      ) {
        return traits;
      }
      _.set(
        traits,
        target.replace(".", "/"),
        operation === "setIfNull" ? { operation, value } : value
      );
      return traits;
    },
    {}
  );

export default async function compute({
  code = "",
  fallbacks = [],
  payload = {}
}: {
  code: string,
  fallbacks: any,
  payload: HullUserUpdateMessage
}) {
  if (!fallbacks.length) {
    return {};
  }
  return getFallbacks("user", jsonata(code).evaluate(payload), fallbacks);
}
