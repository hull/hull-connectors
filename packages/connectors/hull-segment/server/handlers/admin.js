// @flow

import type {
  HullExternalResponse,
  HullContext
  // ,
  // HullIncomingMessage
} from "hull";

export default function admin(
  ctx: HullContext
  // ,
  // message: HullIncomingMessage
): HullExternalResponse {
  const { clientCredentialsToken, hostname } = ctx;
  return {
    status: 200,
    pageLocation: "admin.html",
    data: {
      apiKey: clientCredentialsToken,
      encoded: Buffer.from(clientCredentialsToken).toString("base64"),
      hostname
    }
  };
}
