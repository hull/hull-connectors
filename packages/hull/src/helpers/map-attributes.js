// @flow

import _ from "lodash";
import type {
  HullContext,
  HullAttributeMapping,
  HullJsonataType,
  HullEntityAttributes
} from "hull";

import jsonata from "jsonata";

const { ConfigurationError } = require("hull/src/errors");

const cast = (type?: HullJsonataType) => (value: any) => {
  if (!type) return value;
  if (type === "array") return `${value}[]`;
  if (type === "number") return `$number(${value})`;
  if (type === "string") return `${value}&""`;
  if (type === "stringifiedArray") return `${value}[]&""`;
  return value;
};

// TODO clear up the rules for attribute names
const rawHullTraitRegex = /^(account\.)?([A-Za-z_\s]*\/[A-Za-z_\s]*)$/g;
const noDotInPath = str => str.indexOf(".") === -1;
const isRawTrait = trait => rawHullTraitRegex.test(trait);
const mapAttributes = (ctx: HullContext) => ({
  payload,
  mapping,
  entity = "user",
  direction = "incoming",
  serviceSchema = {},
  attributeFormatter = v => v
}: {
  payload: {},
  entity?: "user" | "account",
  direction?: "incoming" | "outgoing",
  mapping: Array<HullAttributeMapping>,
  attributeFormatter: any
}): HullEntityAttributes => {
  const { helpers } = ctx;
  const { operations } = helpers;
  const { setIfNull } = operations;

  const transform = _.reduce(
    mapping,
    (m, { service, hull, overwrite, castAs }) => {
      const casted = cast(castAs);
      const hullExpression = isRawTrait(hull)
        ? hull.replace(rawHullTraitRegex, "$1'$2'")
        : hull;
      const { source, target } =
        direction === "incoming"
          ? { target: hull, source: service }
          : {
              target: service,
              source: noDotInPath(hull)
                ? `${entity}.${hullExpression}`
                : hullExpression
            };
      _.set(
        m,
        target,
        direction === "outgoing" || _.isNil(overwrite) || overwrite
          ? `_{{${casted(source)}}}_`
          : setIfNull(`_{{${casted(source)}}}_`)
      );
      return m;
    },
    {}
  );

  const transformed = JSON.stringify(transform).replace(/"_{{(.*?)}}_"/g, "$1");
  const response = jsonata(transformed).evaluate(payload);

  return _.reduce(
    response,
    (r, val, attribute) => {
      const schema = _.get(serviceSchema, attribute, {});
      const { formatter = attributeFormatter } = schema;
      r[attribute] = formatter(val);
      return r;
    },
    {}
  );
};

module.exports = mapAttributes;
