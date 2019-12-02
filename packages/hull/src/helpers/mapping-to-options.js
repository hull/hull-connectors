// @flow

import _ from "lodash";
import type { HullContext, HullAttributeMapping, HullUISelectData } from "hull";

const selectFromKey = (k: string = "") => ({
  label: _.last(k.split(".")),
  value: k
});

const mappingToOptions = (ctx: HullContext) => ({
  type,
  direction,
  label
}: {
  type: string,
  direction: string,
  label: string
}): HullUISelectData => {
  const { connectorConfig } = ctx;
  // manifest from ConnectorConfig is the one committed with the repository
  const { manifest } = connectorConfig;

  const mappings: {
    top_level?: Array<HullAttributeMapping>,
    mapping: Array<HullAttributeMapping>
  } = _.get(manifest, ["mappings", type, direction]);
  if (!mappings) {
    return {};
  }
  const options = _.reduce(
    mappings.mapping,
    (m, entry) => {
      const { service } = entry;
      if (service.indexOf(".") > -1) {
        const path = service.split(".");
        const prefix = _.initial(path) || [];
        const opts = _.get(m, [...prefix, "options"]) || [];
        _.set(m, prefix, {
          label: _.last(prefix),
          options: [...opts, selectFromKey(service)]
        });
      } else {
        _.set(m, service, selectFromKey(service));
      }
      return m;
    },
    {}
  );
  return {
    label,
    options: _.sortBy(_.values(options), v => !!_.get(v, "options"))
  };
};
module.exports = mappingToOptions;
