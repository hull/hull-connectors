// @flow

import type { HullContext } from "hull";

// eslint-disable-next-line no-unused-vars
export default async (ctx: HullContext) => {
  return {
    flow_control: { type: "next" }
  };
};
