// @flow

import _ from "lodash";
import type {
  HullContext,
  HullAttributeMapping,
  HullJsonataType,
  HullEntityAttributes
} from "hull";
import jsonata from "jsonata";

const cast = (type?: HullJsonataType) => (value: any) => {
  if (!type) return value;
  if (type === "array") return `${value}[]`;
  if (type === "number") return `$number(${value})`;
  if (type === "string") return `${value}&""`;
  if (type === "stringifiedArray") return `${value}[]&""`;
  return value;
};

const noDotInPath = str => str.indexOf(".") === -1;
const mapAttributes = (ctx: HullContext) => ({
  payload,
  mapping,
  entity = "user",
  direction = "incoming"
}: {
  payload: {},
  entity?: "user" | "account",
  direction?: "incoming" | "outgoing",
  mapping: Array<HullAttributeMapping>
}): HullEntityAttributes => {
  const { helpers } = ctx;
  const { operations } = helpers;
  // manifest from ConnectorConfig is the one committed with the repository
  const { setIfNull } = operations;

  const transform = _.reduce(
    mapping,
    (m, { service, hull, overwrite, castAs }) => {
      const casted = cast(castAs);
      const { source, target } =
        direction === "incoming"
          ? {
              target: hull,
              source: service
            }
          : {
              target: service,
              source: noDotInPath(hull) ? `${entity}.${hull}` : hull
            };
      _.set(
        m,
        target,
        overwrite
          ? `_{{${casted(source)}}}_`
          : setIfNull(`_{{${casted(source)}}}_`)
      );
      return m;
    },
    {}
  );

  const transformed = JSON.stringify(transform).replace(/"_{{(.*?)}}_"/g, "$1");
  const response = jsonata(transformed).evaluate(payload);
  return response;
};

module.exports = mapAttributes;
