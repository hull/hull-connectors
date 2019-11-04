// @flow
import type { HullContext, HullUISelectResponse } from "hull";
import mappingToOptions from "../lib/mapping-to-options";

const company = async (ctx: HullContext): HullUISelectResponse => {
  return {
    status: 200,
    data: mappingToOptions(ctx, {
      name: "incoming_company_mapping",
      label: "Clearbit Company"
    })
  };
};
export default company;
