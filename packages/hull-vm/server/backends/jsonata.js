// @flow

import type { HullContext } from "hull";
import jsonata from "jsonata";
import type { Result, ComputeOptions } from "../../types";

export default async function(
  ctx: HullContext,
  { claims, code, payload, entity }: ComputeOptions,
  result: Result,
  hull: any
) {
  const data = jsonata(code).evaluate(payload);
  (entity === "account" ? hull.asAccount : hull.asUser)(claims).traits(data);
  return result;
}
