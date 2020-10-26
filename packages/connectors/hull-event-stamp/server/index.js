// @flow
import _ from "lodash";

export default async function handle({
  // hull,
  // user,
  // segments,
  // account,
  // account_segments,
  // changes,
  event,
  private_settings
}): {} {
  const { property_mapping, synchronized_event } = private_settings;
  if (event.event !== synchronized_event) {
    return {};
  }
  return _.reduce(
    property_mapping,
    (attrs, { hull: hullAttribute, service, overwrite }) => {
      const value = _.get(event, ["properties", service]);
      attrs[hullAttribute.replace(/^\//, "")] = overwrite
        ? value
        : { operation: "setIfNull", value };
      return attrs;
    },
    {}
  );
}
