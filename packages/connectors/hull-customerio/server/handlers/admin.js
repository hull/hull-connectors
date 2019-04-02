// @flow
import type { HullContext, HullExternalResponse } from "hull";
import { encrypt } from "../lib/crypto";

const admin = (ctx: HullContext): HullExternalResponse => {
  const { clientCredentials, connectorConfig, hostname } = ctx;
  const { hostSecret } = connectorConfig;
  return {
    status: 200,
    pageLocation: "admin.html",
    data: { hostname, token: encrypt(clientCredentials, hostSecret) }
  };
};

export default admin;
