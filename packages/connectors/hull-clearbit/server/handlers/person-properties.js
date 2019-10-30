// @flow
import type { HullContext, HullUISelectResponse } from "hull";
import mappings from "../mappings";
import mappingToOptions from "../lib/mapping-to-options";

const person = async (_ctx: HullContext): HullUISelectResponse => {
  return {
    status: 200,
    data: mappingToOptions({
      mapping: mappings.Person,
      label: "Clearbit Person"
    })
  };
};
export default person;
