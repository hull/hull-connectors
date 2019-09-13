// @flow
import type { HullContext } from "hull";
// import type { ConfResponse } from "hull-vm";

const configHandler = async (ctx: HullContext): Promise<Object> => {
  return {
    language: ctx.connector.private_settings.language,
    entityType: "account"
  };
};

export default configHandler;
