// @flow
import type { HullContext, HullExternalResponse } from "hull";

const credentials = (_ctx: HullContext): HullExternalResponse => {
  return {
    status: 200,
    data: {
      url: "https://app.segment.com/enable?integration=hull"
    }
  };
};

export default credentials;
