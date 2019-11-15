// @flow

import type { HullContext } from "hull";
import _ from "lodash";

export default function varsFromSettings(
  ctx: HullContext
): { [key: string]: string } {
  const { connector } = ctx;
  const { private_settings = {} } = connector;
  const { variables = [] } = private_settings;
  return _.reduce(
    variables,
    (m, { key, value }, _i: number) => {
      m[key] = value;
      return m;
    },
    {}
  );
}
