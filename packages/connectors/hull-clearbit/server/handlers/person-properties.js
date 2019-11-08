// @flow
import type { HullContext, HullUISelectResponse } from "hull";

const person = async (ctx: HullContext): HullUISelectResponse => {
  const { mappingToOptions } = ctx.helpers;
  return {
    status: 200,
    data: mappingToOptions({
      type: "person",
      direction: "incoming",
      label: "Clearbit Person"
    })
  };
};
export default person;
