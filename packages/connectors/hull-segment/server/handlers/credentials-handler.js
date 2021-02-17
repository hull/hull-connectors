// @flow
import type { HullContext, HullExternalResponse } from "hull";

const credentials = (ctx: HullContext): HullExternalResponse => {
  const { clientCredentialsEncryptedToken } = ctx;
  return {
    status: 200,
    data: {
      url: clientCredentialsEncryptedToken
    }
  };
};

export default credentials;
