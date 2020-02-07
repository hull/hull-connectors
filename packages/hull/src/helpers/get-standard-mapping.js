// @flow

import _ from "lodash";
import type { HullContext, HullAttributeMapping } from "hull";

const getStandardMapping = (ctx: HullContext) => ({
  type,
  direction
}: {
  type: string,
  direction: string
}): Array<HullAttributeMapping> => {
  const { connectorConfig } = ctx;
  const { manifest } = connectorConfig;
  const mappings: {
    top_level?: Array<HullAttributeMapping>
  } = _.get(manifest, ["mappings", type, direction]);
  const { top_level = [] } = mappings;
  return top_level;
};

module.exports = getStandardMapping;
