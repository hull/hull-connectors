// @flow
import _ from "lodash";
import type { ComputeParams } from "../types";

import Topologica from "./topologica";

import OPERATIONS from "./operations";

const getStateChanges = changes =>
  _.reduce(
    changes,
    (stateChange, { params, computed_attribute, operation }) => {
      const { attribute, attributes = [] } = params;
      const op = OPERATIONS[operation];
      if (op) {
        stateChange[`user.${computed_attribute}`] = [
          op(params) || _.identity,
          [attribute, ...attributes]
        ];
      }
      return stateChange;
    },
    {}
  );

const omitInvalid = changes =>
  _.omitBy(changes, ({ computed_attribute }) => !computed_attribute);

export default async function compute({
  computedAttributes = [],
  payload = {}
}: ComputeParams) {
  if (!computedAttributes.length) {
    return {};
  }

  const stateChanges = getStateChanges(omitInvalid(computedAttributes));

  const dataflow = Topologica(stateChanges);
  dataflow.set(payload);
  const { user } = dataflow.getComputed();

  return user;
}
