// @flow
import type { HullContext, HullExternalResponse } from "hull";

const credentials = (ctx: HullContext): HullExternalResponse => {
  const { clientCredentialsEncryptedToken, hostname } = ctx;
  return {
    status: 200,
    data: {
      url: `https://${hostname}/webhook?conf=${clientCredentialsEncryptedToken}`
    }
  };
};

export default credentials;
