// @flow
import type { HullContext, HullUISelectResponse } from "hull";

const company = async (ctx: HullContext): HullUISelectResponse => {
  const { mappingToOptions } = ctx.helpers;
  return {
    status: 200,
    data: mappingToOptions({
      type: "company",
      direction: "incoming",
      label: "Clearbit Company"
    })
  };
};
export default company;
