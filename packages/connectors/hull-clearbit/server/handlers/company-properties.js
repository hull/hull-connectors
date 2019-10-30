// @flow
import type { HullContext, HullUISelectResponse } from "hull";
import mappings from "../mappings";
import mappingToOptions from "../lib/mapping-to-options";

const company = async (_ctx: HullContext): HullUISelectResponse => {
  return {
    status: 200,
    data: mappingToOptions({
      mapping: mappings.Company,
      label: "Clearbit Prospect"
    })
  };
};
export default company;
