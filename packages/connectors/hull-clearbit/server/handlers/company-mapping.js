// @flow
import type { HullContext, HullUISelectResponse } from "hull";
import _ from "lodash";
import mappings from "../mappings";

const prospect = async (_ctx: HullContext): HullUISelectResponse => {
  return {
    status: 200,
    data: {
      options: _.map(mappings.Company, (v, k: string) => ({
        label: k,
        value: k
      }))
    }
  };
};
export default prospect;
