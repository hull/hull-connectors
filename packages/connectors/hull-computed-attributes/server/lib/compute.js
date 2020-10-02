// @flow
import _ from "lodash";
import flat from "flat";
import type { ComputeParams } from "../types";
import getTraits from "./getTraits";

import OPERATIONS from "./operations";

const omitInvalid = changes =>
  _.omitBy(changes, ({ computed_attribute }) => !computed_attribute);

const getStateChanges = changes =>
  _.reduce(
    changes,
    (stateChange, { params, computed_attribute, operation }) => {
      const { attribute, attributes = [] } = params;
      const op = OPERATIONS[operation];
      if (op) {
        stateChange[computed_attribute] = [
          op(params) || _.identity,
          _.compact([attribute, ...attributes])
        ];
      }
      return stateChange;
    },
    {}
  );

const getType = i => {
  if (_.isArray(i)) return "array";
  if (_.isPlainObject(i)) return "object";
  if (_.isFinite(i)) return "number";
  if (_.isString(i)) return "string";
  if (i === true || i === false) return "boolean";
};
export default async function compute({
  computedAttributes = [],
  payload = {}
}: ComputeParams) {
  if (!computedAttributes.length) {
    return {};
  }

  console.log(computedAttributes);
  const funcs = getStateChanges(omitInvalid(computedAttributes));
  const traits = getTraits(funcs, payload);
  const schema = _.map(
    computedAttributes,
    ({ computed_attribute, type }, _index: number) => ({
      key: computed_attribute,
      defined_type: type,
      type: getType(_.get(traits, computed_attribute))
    })
  );
  const returnedTraits = _.reduce(
    schema,
    (t, { key }, _i) => {
      _.set(t, key, _.get(traits, key));
      return t;
    },
    {}
  );
  console.log({ traits, schema, returnedTraits });
  return {
    traits: returnedTraits,
    schema
  };
}
