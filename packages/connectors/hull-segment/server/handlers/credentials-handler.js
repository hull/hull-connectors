// @flow
import type { HullContext, HullExternalResponse } from "hull";
import jwt from "jwt-simple";

const credentials = (ctx: HullContext): HullExternalResponse => {
  const { connectorConfig, hostSecret } = ctx;
  const apiKey = jwt.encode(connectorConfig, hostSecret);
  return {
    status: 200,
    data: {
      url: Buffer.from(apiKey).toString("base64")
    }
  };
};

export default credentials;
