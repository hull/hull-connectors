// @flow
import type { HullContext, HullExternalResponse } from "hull";

const credentials = (installUrl: string) => (
  _ctx: HullContext
): HullExternalResponse => {
  // const { clientCredentialsEncryptedToken, hostname } = ctx;
  return {
    status: 200,
    data: {
      url: installUrl
    }
  };
};

export default credentials;
