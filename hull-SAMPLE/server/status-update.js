/* @flow */
import type { HullContext, HullStatusResponse } from "hull";

const statusUpdate = async (_ctx: HullContext): HullStatusResponse => {
  // const { client = {}, connector = {} } = ctx;
  // const { private_settings = {} } = connector;
  return { status: "ok", messages: ["Good"] };
};

export default statusUpdate;
