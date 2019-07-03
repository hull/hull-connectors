// @flow
import type { HullContext, HullExternalResponse } from "hull";

const adminHandler = (ctx: HullContext): HullExternalResponse => {
  const { clientCredentials, hostname } = ctx;
  const { id } = clientCredentials;
  return {
    status: 200,
    pageLocation: "admin.html",
    data: {
      id,
      host: hostname
    }
  };
};

export default adminHandler;
