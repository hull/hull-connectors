// @noflow
import _ from "lodash";
import type { HullContext } from "hull";

const zip = (ctx: HullContext): {} => {
  const pairs = _.map(ctx.connector.private_settings.headers, v => [
    v.key,
    v.value
  ]);
  return _.fromPairs(pairs);
};

export default zip;
