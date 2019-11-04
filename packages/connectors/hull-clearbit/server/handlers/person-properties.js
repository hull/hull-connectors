// @flow
import type { HullContext, HullUISelectResponse } from "hull";
import mappingToOptions from "../lib/mapping-to-options";

const person = async (ctx: HullContext): HullUISelectResponse => {
  return {
    status: 200,
    data: mappingToOptions(ctx, {
      name: "incoming_person_mapping",
      label: "Clearbit Person"
    })
  };
};
export default person;
