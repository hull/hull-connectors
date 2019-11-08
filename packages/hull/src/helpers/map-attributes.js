// @flow

import _ from "lodash";
import type {
  HullContext,
  HullEntityAttributes,
  HullAttributeMapping
} from "hull";
import jsonata from "jsonata";

const debug = require("debug")("hull:map-attributes");

const mapAttributes = (ctx: HullContext) => ({
  entity,
  type,
  mapping,
  direction
}: {
  entity: {},
  mapping: string,
  type: string,
  direction: string
}): HullEntityAttributes => {
  const { connectorConfig, helpers, connector } = ctx;
  const { operations } = helpers;
  // manifest from ConnectorConfig is the one committed with the repository
  const { manifest } = connectorConfig;
  const { setIfNull } = operations;
  const mappings: {
    top_level?: Array<HullAttributeMapping>
  } = _.get(manifest, ["mappings", type, direction]);
  const settings =
    connector.private_settings[mapping] || connector.settings[mapping];
  const { top_level = [] } = mappings;
  const transform = _.reduce(
    [...settings, ...top_level],
    (m, { service, hull, overwrite }) => {
      _.set(
        m,
        hull,
        overwrite ? `_{{${service}}}_` : setIfNull(`_{{${service}}}_`)
      );
      return m;
    },
    {}
  );

  const transformed = JSON.stringify(transform).replace(/"_{{(.*?)}}_"/g, "$1");
  const response = jsonata(transformed).evaluate(entity);
  return response;
};

module.exports = mapAttributes;
