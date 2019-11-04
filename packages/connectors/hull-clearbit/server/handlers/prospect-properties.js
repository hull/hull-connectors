// @flow
import type { HullContext, HullUISelectResponse } from "hull";
import mappingToOptions from "../lib/mapping-to-options";

const prospect = async (ctx: HullContext): HullUISelectResponse => {
  return {
    status: 200,
    data: mappingToOptions(ctx, {
      name: "incoming_prospect_mapping",
      label: "Clearbit Prospect"
    })
  };
};
export default prospect;
