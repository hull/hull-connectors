// @flow
import type { HullContext, HullUISelectResponse } from "hull";

const prospect = async (ctx: HullContext): HullUISelectResponse => {
  const { mappingToOptions } = ctx.helpers;
  return {
    status: 200,
    data: mappingToOptions({
      type: "prospect",
      direction: "incoming",
      label: "Clearbit Prospect"
    })
  };
};
export default prospect;
