// @flow
import type { HullContext } from "hull";
// import type { ConfResponse } from "hull-vm";

const configHandler = async (ctx: HullContext): Promise<Object> => {
  return {
    entity: "account",
    language: ctx.connector.private_settings.language || "javascript"
  };
};

export default configHandler;
