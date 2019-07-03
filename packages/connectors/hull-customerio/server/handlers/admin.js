// @flow
import type { HullContext, HullExternalResponse } from "hull";

const admin = (ctx: HullContext): HullExternalResponse => {
  const { clientCredentialsEncryptedToken, hostname } = ctx;
  return {
    status: 200,
    pageLocation: "admin.html",
    data: { hostname, token: clientCredentialsEncryptedToken }
  };
};

export default admin;
