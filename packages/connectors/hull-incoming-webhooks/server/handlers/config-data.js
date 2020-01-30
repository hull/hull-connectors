// @flow
import type { HullContext } from "hull";
// import type { ConfResponse } from "hull-vm";

const configHandler = async (ctx: HullContext): Promise<Object> => {
  return {
    url: `https://${ctx.hostname}/webhooks/${ctx.connector.id}/${ctx.clientCredentialsEncryptedToken}`
  };
};

export default configHandler;
