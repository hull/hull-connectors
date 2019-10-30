// @flow
import type { HullContext, HullUISelectResponse } from "hull";
import mappings from "../mappings";
import mappingToOptions from "../lib/mapping-to-options";

const prospect = async (_ctx: HullContext): HullUISelectResponse => {
  return {
    status: 200,
    data: mappingToOptions({
      mapping: mappings.Prospect,
      label: "Clearbit Prospect"
    })
  };
};
export default prospect;
