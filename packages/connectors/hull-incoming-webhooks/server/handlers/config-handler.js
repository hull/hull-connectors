// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";
import type { ConfResponse } from "../../types";

const confHandler = (
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse => {
  const { clientCredentialsEncryptedToken } = ctx;
  const { hostname } = message;
  if (hostname && clientCredentialsEncryptedToken) {
    const data: ConfResponse = {
      hostname,
      token: clientCredentialsEncryptedToken
    };
    return {
      status: 200,
      data
    };
  }
  return {
    status: 403
  };
};

export default confHandler;
