// @flow
import type { HullContext } from "hull";
// import type { ConfResponse } from "hull-vm";

const configHandler = async (_ctx: HullContext): Promise<Object> => {
  return {
    entityType: "account"
  };
};

export default configHandler;
